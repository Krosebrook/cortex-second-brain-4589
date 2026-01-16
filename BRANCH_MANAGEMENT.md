# Branch Management Best Practices

## Overview
This document provides comprehensive guidelines for branch management in the TESSA repository. Following these practices ensures a clean, organized repository and smooth collaboration.

## Branch Naming Convention

Use descriptive branch names with the following prefixes:

| Prefix | Purpose | Example | When to Use |
|--------|---------|---------|-------------|
| `feature/` | New features | `feature/knowledge-export` | Adding new functionality |
| `fix/` | Bug fixes | `fix/chat-scroll-issue` | Fixing bugs |
| `bugfix/` | Alternative to fix/ | `bugfix/login-error` | Alternative bug fix prefix |
| `hotfix/` | Production hotfixes | `hotfix/security-patch` | Urgent production fixes |
| `docs/` | Documentation updates | `docs/api-examples` | Documentation changes |
| `refactor/` | Code refactoring | `refactor/auth-context` | Code restructuring |
| `test/` | Testing additions | `test/chat-service` | Adding or updating tests |
| `perf/` | Performance improvements | `perf/virtualized-list` | Performance optimizations |
| `style/` | Code style/formatting | `style/consistent-formatting` | Style and formatting changes |
| `chore/` | Maintenance tasks | `chore/update-deps` | Maintenance and tooling |

### Branch Naming Best Practices

1. **Be Descriptive**: Use clear, descriptive names that explain the purpose
   ```bash
   # ✅ Good
   feature/user-authentication
   fix/memory-leak-in-chat
   docs/contribution-guidelines
   
   # ❌ Avoid
   feature/new-stuff
   fix/bug
   update
   ```

2. **Use Kebab-Case**: Separate words with hyphens
   ```bash
   # ✅ Good
   feature/real-time-notifications
   
   # ❌ Avoid
   feature/realTimeNotifications
   feature/real_time_notifications
   ```

3. **Keep It Concise**: Aim for 2-4 words after the prefix
   ```bash
   # ✅ Good
   feature/chat-export
   
   # ❌ Too Long
   feature/implement-chat-message-export-functionality-with-multiple-formats
   ```

4. **Reference Issues**: Include issue numbers for tracking
   ```bash
   feature/123-add-dark-mode
   fix/456-resolve-login-timeout
   ```

## Branch Lifecycle

### Creating a Branch

Always create branches from an up-to-date `main` branch:

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Create and checkout new branch
git checkout -b feature/your-feature-name

# Alternative: Create branch from main without switching first
git checkout -b feature/your-feature-name main
```

### Keeping Branches Up to Date

Regularly sync your branch with `main` to avoid merge conflicts:

#### Using Rebase (Recommended for clean history)
```bash
# 1. Fetch latest changes
git fetch origin

# 2. Rebase your branch on main
git rebase origin/main

# 3. Force push if already pushed (use with caution)
git push --force-with-lease origin feature/your-feature-name
```

#### Using Merge (Simpler, creates merge commits)
```bash
# 1. Fetch latest changes
git fetch origin

# 2. Merge main into your branch
git merge origin/main

# 3. Push changes
git push origin feature/your-feature-name
```

### Deleting Branches After Merge

Clean up branches after they've been merged to keep the repository organized.

#### Delete Local Branch
```bash
# Delete local branch (safe - prevents deletion if not merged)
git branch -d feature/your-feature-name

# Force delete local branch (use with caution)
git branch -D feature/your-feature-name
```

#### Delete Remote Branch
```bash
# Delete remote branch
git push origin --delete feature/your-feature-name

# Alternative syntax
git push origin :feature/your-feature-name
```

#### Delete Local Tracking Branches
```bash
# Remove references to deleted remote branches
git fetch --prune origin

# Or configure git to always prune
git config --global fetch.prune true
```

### Local and Remote Cleanup Commands

#### Clean Up All Merged Branches
```bash
# List merged branches (excluding main)
git branch --merged main | grep -v "main"

# Delete all local merged branches
git branch --merged main | grep -v "main" | xargs -r git branch -d

# Fetch and prune remote tracking branches
git fetch --prune origin
```

#### Check for Stale Branches
```bash
# List all branches with last commit date
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'

# List remote branches with last commit date
git for-each-ref --sort=-committerdate refs/remotes/origin/ \
  --format='%(committerdate:short) %(refname:short)'
```

#### Find Branches Not Merged to Main
```bash
# Local branches not merged
git branch --no-merged main

# Remote branches not merged
git branch -r --no-merged main
```

## Protection Rules

### Main Branch Protection

Configure the following protection rules for the `main` branch:

#### Required Settings
- ✅ **Require pull request reviews before merging**
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Status checks required:
    - Linting
    - Type checking
    - Unit tests
    - Build verification
- ✅ **Require conversation resolution before merging**
- ✅ **Require linear history** (optional but recommended)
- ✅ **Include administrators** (apply rules to admins)

#### Optional but Recommended
- 🔶 **Require signed commits**
- 🔶 **Require deployments to succeed** (if using deployment previews)
- 🔶 **Lock branch** (for emergency situations only)

### Auto-Delete Merged Branches

Enable automatic deletion of head branches after PR merge:

1. Go to **Repository Settings**
2. Navigate to **General** → **Pull Requests**
3. Check **"Automatically delete head branches"**

This automatically cleans up branches after merge, reducing manual cleanup work.

## Cleanup Scripts

### Automated Branch Cleanup Script

Use the following script to clean up merged branches:

```bash
#!/bin/bash
# cleanup-branches.sh
# Cleans up merged branches locally and prunes remote references

echo "🧹 Cleaning up merged branches..."

# Delete local branches that have been merged to main
git branch --merged main | grep -v "main" | xargs -r git branch -d

# Prune remote tracking branches
git fetch --prune origin

echo "✅ Cleanup complete!"

# Optional: Show remaining branches
echo ""
echo "📋 Remaining branches:"
git branch -a
```

### Usage
```bash
# Make the script executable
chmod +x cleanup-branches.sh

# Run the cleanup
./cleanup-branches.sh
```

### Advanced Cleanup Script

For more control, use this enhanced version:

```bash
#!/bin/bash
# cleanup-branches-advanced.sh

# Configuration
DRY_RUN=false
DAYS_STALE=90

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --days)
            DAYS_STALE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🔍 Finding stale branches (inactive for $DAYS_STALE days)..."

# Find branches older than specified days
STALE_DATE=$(date -d "$DAYS_STALE days ago" +%s)

git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/heads/ | \
while read branch date; do
    if [ "$branch" != "main" ] && [ "$date" -lt "$STALE_DATE" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo "[DRY RUN] Would delete: $branch"
        else
            echo "Deleting: $branch"
            git branch -D "$branch"
        fi
    fi
done

echo "✅ Complete!"
```

## Stale Branch Detection

### Identifying Stale Branches

A branch is considered stale if:
- ✓ No commits in the last 90 days
- ✓ Associated PR is closed or merged
- ✓ Branch is not protected
- ✓ No active development or discussion

### When to Delete vs Preserve

#### Delete When:
- ✅ PR has been merged to main
- ✅ PR has been closed without merging
- ✅ Branch is a temporary artifact (e.g., edit/edt-*)
- ✅ Branch has no unique commits
- ✅ All stakeholders confirm branch is no longer needed

#### Preserve When:
- ⚠️ Branch contains experimental work that may be revisited
- ⚠️ Branch is for long-term feature development
- ⚠️ Branch is a release or maintenance branch
- ⚠️ Uncertain about branch purpose - verify first

### Communication Before Deletion

Before deleting branches, especially if they might contain valuable work:

1. **Check with the Branch Author**
   ```bash
   # Find who created/last worked on a branch
   git log -1 --format='%an <%ae>' origin/branch-name
   ```

2. **Review Branch Contents**
   ```bash
   # Check unique commits
   git log main..branch-name --oneline
   
   # Review changes
   git diff main...branch-name
   ```

3. **Announce Bulk Deletions**
   - Post in team chat or discussion board
   - Provide 3-7 day notice for large cleanup operations
   - List branches to be deleted
   - Offer opportunity for preservation requests

4. **Document Deletion**
   - Keep a record of deleted branches
   - Note reason for deletion
   - Provide deletion date

### Stale Branch Notification Template

```markdown
## Stale Branch Cleanup Notice

We will be cleaning up the following stale branches on [DATE]:

### Branches to Delete
- `feature/old-experiment` (last commit: 6 months ago)
- `fix/legacy-issue` (PR #123 closed)
- `docs/outdated-guide` (content superseded)

### Reason
These branches are inactive and no longer needed. 

### Action Required
If you need any of these branches preserved, please comment by [DATE].

### Recovery
Deleted branches can be restored from git history if needed.
```

## GitHub Actions for Automated Stale Branch Detection

Consider implementing GitHub Actions to automate stale branch detection:

```yaml
name: Stale Branch Detection

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch:

jobs:
  detect-stale-branches:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Find stale branches
        run: |
          echo "## Stale Branches Report" >> $GITHUB_STEP_SUMMARY
          git for-each-ref --sort=-committerdate refs/remotes/origin/ \
            --format='%(committerdate:short) %(refname:short)' | \
            awk -v date="$(date -d '90 days ago' +%Y-%m-%d)" \
            '$1 < date {print}' >> $GITHUB_STEP_SUMMARY
```

## Best Practices Summary

1. ✅ **Always create branches from up-to-date main**
2. ✅ **Use meaningful, consistent branch names**
3. ✅ **Keep branches short-lived** (days to weeks, not months)
4. ✅ **Sync regularly with main** to avoid conflicts
5. ✅ **Delete branches immediately after merge**
6. ✅ **Use pull requests** for all changes to main
7. ✅ **Enable branch protection** on main
8. ✅ **Enable auto-delete** for merged branches
9. ✅ **Perform regular audits** (monthly or quarterly)
10. ✅ **Communicate before bulk deletions**

## Quick Reference Commands

```bash
# Create branch
git checkout -b feature/branch-name

# Update branch with main
git fetch origin && git rebase origin/main

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name

# Clean up merged branches
git branch --merged main | grep -v "main" | xargs -r git branch -d

# Prune remote tracking branches
git fetch --prune origin

# List stale branches
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'
```

---

## Additional Resources

- [Git Branch Documentation](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Git Best Practices](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** 2026-01-15  
**Version:** 1.0
