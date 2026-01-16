# Proposed Addition to CONTRIBUTING.md

> **Note:** This file contains the proposed "Branch Management" section to be added to CONTRIBUTING.md. 
> This is for review purposes only and should be manually added to CONTRIBUTING.md in a future PR after branch cleanup is complete.

---

## Branch Management

Effective branch management is crucial for maintaining a clean, organized repository and enabling smooth collaboration. This section outlines our branch management practices and guidelines.

### Branch Naming Convention

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

**Best Practices:**
- Be descriptive: `feature/user-authentication` not `feature/new-stuff`
- Use kebab-case: `feature/real-time-notifications`
- Keep it concise: Aim for 2-4 words after the prefix
- Reference issues when applicable: `fix/123-memory-leak`

### Branch Lifecycle

#### Creating Branches

Always create branches from an up-to-date `main`:

```bash
# Update main
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/your-feature-name
```

#### Keeping Branches Up to Date

Regularly sync your branch with `main`:

```bash
# Using rebase (recommended for clean history)
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature/your-feature-name

# Using merge (simpler, creates merge commits)
git fetch origin
git merge origin/main
git push origin feature/your-feature-name
```

#### Deleting After Merge

Clean up branches after they've been merged:

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Prune remote tracking branches
git fetch --prune origin
```

### Local and Remote Cleanup Commands

#### Clean Up Merged Branches

```bash
# Delete all local merged branches
git branch --merged main | grep -v "main" | xargs -r git branch -d

# Prune remote tracking branches
git fetch --prune origin
```

#### Check for Stale Branches

```bash
# List branches with last commit date
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'
```

### Protection Rules

#### Main Branch Protection

The `main` branch has the following protection rules:

- ✅ **Required pull request reviews** (1 approval minimum)
- ✅ **Required status checks** (linting, tests, build)
- ✅ **Require conversation resolution** before merging
- ✅ **Require linear history** (optional)

#### Auto-Delete Merged Branches

The repository is configured to automatically delete head branches after PR merge. This reduces manual cleanup work and keeps the branch list manageable.

### Cleanup Scripts

Use the provided cleanup script for automated branch maintenance:

```bash
#!/bin/bash
# cleanup-branches.sh
echo "🧹 Cleaning up merged branches..."
git branch --merged main | grep -v "main" | xargs -r git branch -d
git fetch --prune origin
echo "✅ Cleanup complete!"
```

**Usage:**
```bash
chmod +x cleanup-branches.sh
./cleanup-branches.sh
```

For more advanced cleanup options, see `scripts/cleanup-stale-branches.sh` in the repository.

### Stale Branch Detection

#### When to Delete Branches

Delete branches when:
- ✅ PR has been merged to main
- ✅ PR has been closed without merging
- ✅ Branch is a temporary artifact
- ✅ No commits in the last 90 days
- ✅ All stakeholders confirm it's no longer needed

#### When to Preserve Branches

Preserve branches when:
- ⚠️ Contains experimental work that may be revisited
- ⚠️ Long-term feature development in progress
- ⚠️ Release or maintenance branch
- ⚠️ Purpose is uncertain - verify first

#### Communication Before Deletion

Before deleting stale branches:

1. **Check the branch author:**
   ```bash
   git log -1 --format='%an <%ae>' origin/branch-name
   ```

2. **Review branch contents:**
   ```bash
   git log main..branch-name --oneline
   git diff main...branch-name
   ```

3. **Announce bulk deletions** with 3-7 day notice
4. **Document the deletion** with reason and date

### Best Practices Summary

1. ✅ Always create branches from up-to-date main
2. ✅ Use meaningful, consistent branch names
3. ✅ Keep branches short-lived (days to weeks, not months)
4. ✅ Sync regularly with main to avoid conflicts
5. ✅ Delete branches immediately after merge
6. ✅ Use pull requests for all changes to main
7. ✅ Perform regular branch audits (monthly or quarterly)
8. ✅ Communicate before bulk deletions

---

## Insertion Point in CONTRIBUTING.md

This section should be inserted after the **"Development Workflow"** section and before the **"Coding Standards"** section in the CONTRIBUTING.md file.

Current table of contents would become:
```
- [Development Workflow](#development-workflow)
- [Branch Management](#branch-management)  ← NEW SECTION
- [Coding Standards](#coding-standards)
```
