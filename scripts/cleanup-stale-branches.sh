#!/bin/bash

# cleanup-stale-branches.sh
# Automated script to clean up stale branches in the repository
# Usage: ./scripts/cleanup-stale-branches.sh [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 Running in DRY RUN mode - no branches will be deleted${NC}"
fi

echo -e "${BLUE}🧹 Branch Cleanup Script${NC}"
echo "================================"
echo ""

# Define branches to delete
COPILOT_BRANCHES=(
    "copilot/audit-code-repository"
    "copilot/audit-codebase-documentation"
)

EDIT_BRANCHES=(
    "edit/edt-0488e36f-68a1-484f-bfa0-8af624446b53"
    "edit/edt-08449c4c-bd1d-4888-9b70-e3d7f531545d"
    "edit/edt-2c156bc2-3d6a-43ad-b2d2-2d6497b12e50"
    "edit/edt-5cd79452-405d-46b9-ae75-3ce491f5afc1"
    "edit/edt-5df66913-5817-44ee-a74d-1b74cb920bf8"
    "edit/edt-6ae8b07d-30f8-4283-95ba-8192014a8002"
    "edit/edt-746ae396-3483-4f17-9c08-182bcfbd195a"
    "edit/edt-7afda754-45b3-4f7b-a6fc-1ead3e6e41fd"
    "edit/edt-8a6bbace-7aab-4be8-8dd7-c2d3c05f9061"
    "edit/edt-a336a5d0-ef80-4fe0-a5da-6c18285dfb91"
    "edit/edt-a67cbba8-398f-4dd0-8d17-00a2375a331b"
    "edit/edt-c65824fb-5b19-42f6-82a8-d24387132332"
)

SNYK_BRANCHES=(
    "snyk-upgrade-7035b837ce8afb2ac13cbd2e67503bba"
    "snyk-upgrade-7245622d7002c03cb11d180d5d3bf324"
    "snyk-upgrade-9afccf13546bd44d95d537be7d35d9e0"
    "snyk-upgrade-f4308e432a52a8d8340006576f56ec12"
    "snyk-upgrade-f5fc687721dfd80a7d9a4f237009b494"
)

# Function to delete a branch
delete_branch() {
    local branch=$1
    
    # Check if branch exists remotely
    if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would delete: ${branch}"
        else
            echo -e "Deleting: ${branch}"
            if git push origin --delete "$branch"; then
                echo -e "${GREEN}✓${NC} Deleted: $branch"
            else
                echo -e "${RED}✗${NC} Failed to delete: $branch"
                return 1
            fi
        fi
    else
        echo -e "${YELLOW}⊘${NC} Branch not found: $branch (already deleted?)"
    fi
}

echo -e "${BLUE}📊 Summary:${NC}"
echo "  - Copilot branches: ${#COPILOT_BRANCHES[@]}"
echo "  - Edit branches: ${#EDIT_BRANCHES[@]}"
echo "  - Snyk branches: ${#SNYK_BRANCHES[@]}"
TOTAL_BRANCHES=$((${#COPILOT_BRANCHES[@]} + ${#EDIT_BRANCHES[@]} + ${#SNYK_BRANCHES[@]}))
echo "  - Total to delete: $TOTAL_BRANCHES"
echo ""

# Delete copilot branches
echo -e "${BLUE}🤖 Processing Copilot branches...${NC}"
for branch in "${COPILOT_BRANCHES[@]}"; do
    delete_branch "$branch"
done
echo ""

# Delete edit branches
echo -e "${BLUE}✏️  Processing Edit branches...${NC}"
for branch in "${EDIT_BRANCHES[@]}"; do
    delete_branch "$branch"
done
echo ""

# Delete snyk branches
echo -e "${BLUE}🔒 Processing Snyk branches...${NC}"
for branch in "${SNYK_BRANCHES[@]}"; do
    delete_branch "$branch"
done
echo ""

# Prune remote tracking branches
if [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}🧼 Pruning remote tracking branches...${NC}"
    git fetch --prune origin
    echo -e "${GREEN}✓${NC} Pruned stale remote tracking branches"
    echo ""
fi

# Final verification
echo -e "${BLUE}🔍 Verification:${NC}"
if [ "$DRY_RUN" = false ]; then
    REMAINING_BRANCHES=$(git ls-remote --heads origin | wc -l)
    echo "  - Remaining remote branches: $REMAINING_BRANCHES"
    echo ""
    echo -e "${BLUE}📋 Current branches:${NC}"
    git ls-remote --heads origin | sed 's/.*refs\/heads\//  - /'
else
    echo "  - Dry run completed - no changes made"
fi

echo ""
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}✅ Dry run complete!${NC}"
    echo -e "${YELLOW}Run without --dry-run flag to perform actual deletion${NC}"
else
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
fi
