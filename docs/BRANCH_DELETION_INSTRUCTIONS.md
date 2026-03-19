# Branch Deletion Instructions

## Status
⚠️ **Manual Action Required**

This PR includes comprehensive documentation and automation tooling for branch cleanup, but the actual branch deletion requires manual execution due to git authentication constraints in the automated environment.

## Quick Start - Delete All 19 Branches

### Option 1: Using the Automated Script (Recommended)

```bash
# Clone the repository if you haven't already
git clone https://github.com/Krosebrook/cortex-second-brain-4589.git
cd cortex-second-brain-4589

# Checkout this branch
git checkout copilot/update-contributing-file

# Test the script (dry-run mode)
./scripts/cleanup-stale-branches.sh --dry-run

# Execute the cleanup (this will delete remote branches)
./scripts/cleanup-stale-branches.sh

# Verify only main branch remains
git ls-remote --heads origin
```

### Option 2: Manual Deletion Using Git Commands

```bash
# Delete all 19 branches in one command
git push origin --delete \
  copilot/audit-code-repository \
  copilot/audit-codebase-documentation \
  edit/edt-0488e36f-68a1-484f-bfa0-8af624446b53 \
  edit/edt-08449c4c-bd1d-4888-9b70-e3d7f531545d \
  edit/edt-2c156bc2-3d6a-43ad-b2d2-2d6497b12e50 \
  edit/edt-5cd79452-405d-46b9-ae75-3ce491f5afc1 \
  edit/edt-5df66913-5817-44ee-a74d-1b74cb920bf8 \
  edit/edt-6ae8b07d-30f8-4283-95ba-8192014a8002 \
  edit/edt-746ae396-3483-4f17-9c08-182bcfbd195a \
  edit/edt-7afda754-45b3-4f7b-a6fc-1ead3e6e41fd \
  edit/edt-8a6bbace-7aab-4be8-8dd7-c2d3c05f9061 \
  edit/edt-a336a5d0-ef80-4fe0-a5da-6c18285dfb91 \
  edit/edt-a67cbba8-398f-4dd0-8d17-00a2375a331b \
  edit/edt-c65824fb-5b19-42f6-82a8-d24387132332 \
  snyk-upgrade-7035b837ce8afb2ac13cbd2e67503bba \
  snyk-upgrade-7245622d7002c03cb11d180d5d3bf324 \
  snyk-upgrade-9afccf13546bd44d95d537be7d35d9e0 \
  snyk-upgrade-f4308e432a52a8d8340006576f56ec12 \
  snyk-upgrade-f5fc687721dfd80a7d9a4f237009b494
```

### Option 3: Using GitHub CLI

```bash
# Authenticate with GitHub
gh auth login

# Delete branches using gh (requires repo admin permissions)
gh api repos/Krosebrook/cortex-second-brain-4589/git/refs/heads/copilot/audit-code-repository -X DELETE
gh api repos/Krosebrook/cortex-second-brain-4589/git/refs/heads/copilot/audit-codebase-documentation -X DELETE
# ... (repeat for all branches)

# Or use a loop
for branch in \
  copilot/audit-code-repository \
  copilot/audit-codebase-documentation \
  edit/edt-0488e36f-68a1-484f-bfa0-8af624446b53 \
  edit/edt-08449c4c-bd1d-4888-9b70-e3d7f531545d \
  edit/edt-2c156bc2-3d6a-43ad-b2d2-2d6497b12e50 \
  edit/edt-5cd79452-405d-46b9-ae75-3ce491f5afc1 \
  edit/edt-5df66913-5817-44ee-a74d-1b74cb920bf8 \
  edit/edt-6ae8b07d-30f8-4283-95ba-8192014a8002 \
  edit/edt-746ae396-3483-4f17-9c08-182bcfbd195a \
  edit/edt-7afda754-45b3-4f7b-a6fc-1ead3e6e41fd \
  edit/edt-8a6bbace-7aab-4be8-8dd7-c2d3c05f9061 \
  edit/edt-a336a5d0-ef80-4fe0-a5da-6c18285dfb91 \
  edit/edt-a67cbba8-398f-4dd0-8d17-00a2375a331b \
  edit/edt-c65824fb-5b19-42f6-82a8-d24387132332 \
  snyk-upgrade-7035b837ce8afb2ac13cbd2e67503bba \
  snyk-upgrade-7245622d7002c03cb11d180d5d3bf324 \
  snyk-upgrade-9afccf13546bd44d95d537be7d35d9e0 \
  snyk-upgrade-f4308e432a52a8d8340006576f56ec12 \
  snyk-upgrade-f5fc687721dfd80a7d9a4f237009b494
do
  gh api "repos/Krosebrook/cortex-second-brain-4589/git/refs/heads/$branch" -X DELETE
  echo "Deleted: $branch"
done
```

### Option 4: Using GitHub Web Interface

For each branch to delete:
1. Go to: https://github.com/Krosebrook/cortex-second-brain-4589/branches
2. Find the branch in the list
3. Click the trash icon next to the branch name
4. Confirm deletion

*Note: This is tedious for 19 branches - use one of the automated options above.*

## Verification

After deletion, verify only the main branch remains:

```bash
# Using git
git ls-remote --heads origin

# Expected output:
# <sha>  refs/heads/main
# <sha>  refs/heads/copilot/update-contributing-file (this branch)

# Using GitHub CLI
gh api repos/Krosebrook/cortex-second-brain-4589/branches --jq '.[].name'
```

## Documentation Included in This PR

1. **BRANCH_CLEANUP_PLAN.md** - Detailed rationale and plan for the cleanup
2. **BRANCH_MANAGEMENT.md** - Comprehensive branch management best practices
3. **scripts/cleanup-stale-branches.sh** - Automated cleanup script
4. **BRANCH_DELETION_INSTRUCTIONS.md** - This file

## Why These Branches Are Safe to Delete

✅ **Copilot branches (2):** Associated with merged PRs  
✅ **Edit branches (12):** Temporary auto-generated artifacts  
✅ **Snyk branches (5):** Associated with closed PRs  
✅ **Main branch:** Protected and will NOT be deleted  

## After Branch Deletion

Once the branches are deleted:
1. Merge this PR to main
2. The documentation will be available for future reference
3. The cleanup script can be used for future branch maintenance
4. Consider implementing the recommendations in BRANCH_MANAGEMENT.md

## Need Help?

- Review BRANCH_CLEANUP_PLAN.md for detailed information
- Check BRANCH_MANAGEMENT.md for branch management best practices
- Run `./scripts/cleanup-stale-branches.sh --dry-run` to preview changes

---

**Created:** 2026-01-15  
**Purpose:** Guide manual branch cleanup execution
