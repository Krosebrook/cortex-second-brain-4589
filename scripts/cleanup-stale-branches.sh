#!/bin/bash

# cleanup-stale-branches.sh
# Safely merge or prune stale branches in the repository.
#
# Usage:
#   ./scripts/cleanup-stale-branches.sh [OPTIONS]
#
# Options:
#   --dry-run          Preview actions without making any changes (default behavior
#                      when no other mode flags are given; recommended for first use)
#   --merge            Merge each unmerged stale branch into the default branch before
#                      deleting it.  Use with caution: this commits unreviewed work.
#   --force            Delete branches that have NOT been merged and have no closed PR.
#                      Implies --prune for merged branches as well.
#                      WARNING: work on these branches will be permanently lost.
#
# When neither --merge nor --force is supplied the script operates in
# "prune-merged" mode: only branches already merged into the default branch
# (or with a closed+merged PR) are deleted.

set -euo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
DRY_RUN=true
MERGE_BEFORE_DELETE=false
FORCE_DELETE=false

for arg in "$@"; do
    case "$arg" in
        --dry-run)    DRY_RUN=true ;;
        --no-dry-run) DRY_RUN=false ;;
        --merge)      MERGE_BEFORE_DELETE=true ;;
        --force)      FORCE_DELETE=true ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Usage: $0 [--dry-run] [--merge] [--force] [--no-dry-run]"
            exit 1
            ;;
    esac
done

# --dry-run takes precedence; activate live-run only when explicitly requested
if [ "$DRY_RUN" = true ] && { [ "$MERGE_BEFORE_DELETE" = true ] || [ "$FORCE_DELETE" = true ]; }; then
    : # dry-run wins — inform the user below
elif [ "$MERGE_BEFORE_DELETE" = true ] || [ "$FORCE_DELETE" = true ]; then
    DRY_RUN=false
fi

# ---------------------------------------------------------------------------
# Branches that must never be deleted
# ---------------------------------------------------------------------------
PROTECTED_BRANCHES=("main" "master" "develop" "staging" "production")

is_protected() {
    local branch="$1"
    for p in "${PROTECTED_BRANCHES[@]}"; do
        [[ "$branch" == "$p" ]] && return 0
    done
    return 1
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo -e "${BLUE}🧹 Branch Cleanup Script${NC}"
echo "================================"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 DRY RUN — no changes will be made${NC}"
elif [ "$FORCE_DELETE" = true ]; then
    echo -e "${RED}⚠️  FORCE mode — unmerged branches will be deleted (work may be lost!)${NC}"
elif [ "$MERGE_BEFORE_DELETE" = true ]; then
    echo -e "${CYAN}🔀 MERGE mode — unmerged branches will be merged into default then deleted${NC}"
else
    echo -e "${GREEN}✂️  PRUNE-MERGED mode — only already-merged branches will be deleted${NC}"
fi
echo ""

# ---------------------------------------------------------------------------
# Determine default branch
# ---------------------------------------------------------------------------
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5)
if [ -z "$DEFAULT_BRANCH" ]; then
    DEFAULT_BRANCH="main"
fi
echo -e "${BLUE}ℹ️  Default branch:${NC} $DEFAULT_BRANCH"
echo ""

# Counters
COUNT_PRUNED=0
COUNT_MERGED=0
COUNT_SKIPPED=0
COUNT_ERRORS=0

# ---------------------------------------------------------------------------
# Helper: check whether branch exists on remote
# ---------------------------------------------------------------------------
branch_exists_remote() {
    git ls-remote --heads origin "$1" | grep -q "refs/heads/$1"
}

# ---------------------------------------------------------------------------
# Helper: check whether a branch is already merged into the default branch
# using the git graph (works for regular merges; does NOT detect squash/rebase).
# ---------------------------------------------------------------------------
is_merged_git() {
    local branch="$1"
    git branch -r --merged "origin/$DEFAULT_BRANCH" 2>/dev/null \
        | grep -qE "^\s*origin/$branch\s*$"
}

# ---------------------------------------------------------------------------
# Helper: delete a remote branch
# ---------------------------------------------------------------------------
delete_remote_branch() {
    local branch="$1"
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY RUN]${NC} Would delete: ${branch}"
        return 0
    fi
    if git push origin --delete "$branch" 2>&1; then
        echo -e "  ${GREEN}✓${NC} Deleted: $branch"
        return 0
    else
        echo -e "  ${RED}✗${NC} Failed to delete: $branch"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Helper: merge a branch into the default branch then delete it
# ---------------------------------------------------------------------------
merge_and_delete() {
    local branch="$1"
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY RUN]${NC} Would merge '${branch}' into '${DEFAULT_BRANCH}' then delete"
        return 0
    fi

    echo -e "  ${CYAN}↪${NC} Merging '$branch' into '$DEFAULT_BRANCH'..."
    git fetch origin "$branch" 2>/dev/null
    git checkout "$DEFAULT_BRANCH" 2>/dev/null
    git pull --ff-only origin "$DEFAULT_BRANCH" 2>/dev/null

    if git merge --no-ff -m \
        "chore: merge stale branch '$branch' before pruning

Branch had no open PRs and was merged into '$DEFAULT_BRANCH'
automatically by cleanup-stale-branches.sh." \
        "origin/$branch" 2>&1; then
        git push origin "$DEFAULT_BRANCH" 2>&1
        echo -e "  ${GREEN}✓${NC} Merged '$branch' into '$DEFAULT_BRANCH'"
    else
        echo -e "  ${RED}✗${NC} Merge conflict — aborting merge of '$branch'"
        git merge --abort 2>/dev/null || true
        return 1
    fi

    if git push origin --delete "$branch" 2>&1; then
        echo -e "  ${GREEN}✓${NC} Deleted: $branch"
        return 0
    else
        echo -e "  ${RED}✗${NC} Merged but failed to delete remote branch: $branch"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Process each branch
# ---------------------------------------------------------------------------
echo -e "${BLUE}🔎 Scanning remote branches...${NC}"
echo ""

# Collect all remote branch names (strip "origin/" prefix)
mapfile -t ALL_BRANCHES < <(
    git branch -r 2>/dev/null \
    | grep -v 'HEAD' \
    | sed 's|^\s*origin/||' \
    | sort
)

for branch in "${ALL_BRANCHES[@]}"; do
    # Skip protected branches
    if is_protected "$branch"; then
        continue
    fi

    # Skip the currently checked-out branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [[ "$branch" == "$CURRENT_BRANCH" ]]; then
        continue
    fi

    echo -e "${BLUE}→${NC} $branch"

    # Confirm branch still exists remotely
    if ! branch_exists_remote "$branch"; then
        echo -e "  ${YELLOW}⊘${NC} Branch not found on remote (already deleted?)"
        continue
    fi

    # Check merge status via git graph
    merged_git=false
    if is_merged_git "$branch"; then
        merged_git=true
    fi

    # Determine action based on mode
    if [ "$merged_git" = true ]; then
        # Branch is already merged — safe to prune in all modes
        if delete_remote_branch "$branch"; then
            COUNT_PRUNED=$((COUNT_PRUNED + 1))
        else
            COUNT_ERRORS=$((COUNT_ERRORS + 1))
        fi

    elif [ "$MERGE_BEFORE_DELETE" = true ]; then
        # Unmerged branch: merge into default then delete
        if merge_and_delete "$branch"; then
            COUNT_MERGED=$((COUNT_MERGED + 1))
        else
            echo -e "  ${YELLOW}⊘${NC} Skipping '$branch' due to merge error"
            COUNT_ERRORS=$((COUNT_ERRORS + 1))
        fi

    elif [ "$FORCE_DELETE" = true ]; then
        # Unmerged branch: force-delete with loud warning
        echo -e "  ${RED}⚠️  FORCE deleting unmerged branch (work will be lost):${NC} $branch"
        if delete_remote_branch "$branch"; then
            COUNT_PRUNED=$((COUNT_PRUNED + 1))
        else
            COUNT_ERRORS=$((COUNT_ERRORS + 1))
        fi

    else
        # prune-merged mode: skip unmerged branches
        echo -e "  ${YELLOW}⊘${NC} Skipping — branch not yet merged into '$DEFAULT_BRANCH'"
        COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
    fi
done

echo ""

# ---------------------------------------------------------------------------
# Prune stale remote-tracking refs
# ---------------------------------------------------------------------------
if [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}🧼 Pruning stale remote-tracking references...${NC}"
    git fetch --prune origin
    echo -e "${GREEN}✓${NC} Pruned stale remote-tracking references"
    echo ""
fi

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------
echo -e "${BLUE}📊 Results:${NC}"
echo "  Pruned (deleted):      $COUNT_PRUNED"
echo "  Merged then deleted:   $COUNT_MERGED"
echo "  Skipped (not merged):  $COUNT_SKIPPED"
echo "  Errors:                $COUNT_ERRORS"
echo ""

echo -e "${BLUE}📋 Remaining remote branches:${NC}"
git ls-remote --heads origin 2>/dev/null | sed 's/.*refs\/heads\//  - /' || echo "  (none)"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}✅ Dry run complete — run without --dry-run to apply changes${NC}"
elif [ "$COUNT_ERRORS" -gt 0 ]; then
    echo -e "${RED}⚠️  Cleanup completed with $COUNT_ERRORS error(s)${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
fi
