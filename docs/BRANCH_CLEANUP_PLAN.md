# Branch Cleanup Plan

## Overview
This document outlines the branch cleanup plan for the cortex-second-brain-4589 repository. The repository currently has 20 branches, and 19 stale branches need to be deleted to improve repository hygiene.

## Current Branch Status

### Total Branches: 20
- **1** Main branch (main)
- **2** Copilot-generated branches (merged PRs)
- **12** Temporary edit branches (auto-generated)
- **5** Stale Snyk security update branches (closed PRs)

### Remaining After Cleanup: 1
- main

## Branches to Delete (19 Total)

### Copilot Branches (2)
These branches were created by GitHub Copilot and have associated merged PRs:

| Branch Name | Status | Associated PR | Reason for Deletion |
|-------------|--------|---------------|---------------------|
| `copilot/audit-code-repository` | Merged | #7 | PR merged, branch no longer needed |
| `copilot/audit-codebase-documentation` | Merged | #8, #9 | PR merged, branch no longer needed |

### Edit Branches (12)
These are temporary branches auto-generated during editing sessions:

| Branch Name | Reason for Deletion |
|-------------|---------------------|
| `edit/edt-0488e36f-68a1-484f-bfa0-8af624446b53` | Temporary editing artifact |
| `edit/edt-08449c4c-bd1d-4888-9b70-e3d7f531545d` | Temporary editing artifact |
| `edit/edt-2c156bc2-3d6a-43ad-b2d2-2d6497b12e50` | Temporary editing artifact |
| `edit/edt-5cd79452-405d-46b9-ae75-3ce491f5afc1` | Temporary editing artifact |
| `edit/edt-5df66913-5817-44ee-a74d-1b74cb920bf8` | Temporary editing artifact |
| `edit/edt-6ae8b07d-30f8-4283-95ba-8192014a8002` | Temporary editing artifact |
| `edit/edt-746ae396-3483-4f17-9c08-182bcfbd195a` | Temporary editing artifact |
| `edit/edt-7afda754-45b3-4f7b-a6fc-1ead3e6e41fd` | Temporary editing artifact |
| `edit/edt-8a6bbace-7aab-4be8-8dd7-c2d3c05f9061` | Temporary editing artifact |
| `edit/edt-a336a5d0-ef80-4fe0-a5da-6c18285dfb91` | Temporary editing artifact |
| `edit/edt-a67cbba8-398f-4dd0-8d17-00a2375a331b` | Temporary editing artifact |
| `edit/edt-c65824fb-5b19-42f6-82a8-d24387132332` | Temporary editing artifact |

### Snyk Security Update Branches (5)
These branches were created by Snyk for security updates with closed PRs:

| Branch Name | Status | Associated PR | Reason for Deletion |
|-------------|--------|---------------|---------------------|
| `snyk-upgrade-7035b837ce8afb2ac13cbd2e67503bba` | Closed | #2 | PR closed, updates not merged |
| `snyk-upgrade-7245622d7002c03cb11d180d5d3bf324` | Closed | #3 | PR closed, updates not merged |
| `snyk-upgrade-9afccf13546bd44d95d537be7d35d9e0` | Closed | #1 | PR closed, updates not merged |
| `snyk-upgrade-f4308e432a52a8d8340006576f56ec12` | Closed | #5 | PR closed, updates not merged |
| `snyk-upgrade-f5fc687721dfd80a7d9a4f237009b494` | Closed | #4 | PR closed, updates not merged |

## Safety Checks Completed

✅ **All copilot branches have merged PRs** - Safe to delete after merge  
✅ **All Snyk branches have closed PRs** - No longer needed  
✅ **All edit branches are temporary artifacts** - Safe to delete  
✅ **Main branch is protected** - Will not be affected  
✅ **No active work on any of these branches** - Verified all are stale  

## Deletion Commands

### Manual Deletion (One at a time)
```bash
# Delete copilot branches
git push origin --delete copilot/audit-code-repository
git push origin --delete copilot/audit-codebase-documentation

# Delete edit branches
git push origin --delete edit/edt-0488e36f-68a1-484f-bfa0-8af624446b53
git push origin --delete edit/edt-08449c4c-bd1d-4888-9b70-e3d7f531545d
git push origin --delete edit/edt-2c156bc2-3d6a-43ad-b2d2-2d6497b12e50
git push origin --delete edit/edt-5cd79452-405d-46b9-ae75-3ce491f5afc1
git push origin --delete edit/edt-5df66913-5817-44ee-a74d-1b74cb920bf8
git push origin --delete edit/edt-6ae8b07d-30f8-4283-95ba-8192014a8002
git push origin --delete edit/edt-746ae396-3483-4f17-9c08-182bcfbd195a
git push origin --delete edit/edt-7afda754-45b3-4f7b-a6fc-1ead3e6e41fd
git push origin --delete edit/edt-8a6bbace-7aab-4be8-8dd7-c2d3c05f9061
git push origin --delete edit/edt-a336a5d0-ef80-4fe0-a5da-6c18285dfb91
git push origin --delete edit/edt-a67cbba8-398f-4dd0-8d17-00a2375a331b
git push origin --delete edit/edt-c65824fb-5b19-42f6-82a8-d24387132332

# Delete snyk branches
git push origin --delete snyk-upgrade-7035b837ce8afb2ac13cbd2e67503bba
git push origin --delete snyk-upgrade-7245622d7002c03cb11d180d5d3bf324
git push origin --delete snyk-upgrade-9afccf13546bd44d95d537be7d35d9e0
git push origin --delete snyk-upgrade-f4308e432a52a8d8340006576f56ec12
git push origin --delete snyk-upgrade-f5fc687721dfd80a7d9a4f237009b494
```

### Automated Deletion Script
See `scripts/cleanup-stale-branches.sh` for an automated cleanup script.

## Benefits of Cleanup

1. **Improved Repository Hygiene** - Cleaner branch list makes it easier to find active work
2. **Better Developer Experience** - Reduces clutter in branch selection menus
3. **Clearer History** - Makes it easier to understand repository evolution
4. **Foundation for Automation** - Sets precedent for automated stale branch detection
5. **Follows Best Practices** - Aligns with GitHub's recommended workflow

## Post-Cleanup Verification

After deletion, verify with:
```bash
# List all remote branches
git ls-remote --heads origin

# Expected output: Only refs/heads/main should remain
```

## Future Recommendations

1. **Enable Auto-Delete on Merge** - Configure repository settings to automatically delete branches after PR merge
2. **Regular Cleanup Schedule** - Perform branch audits quarterly
3. **Branch Protection Rules** - Ensure main branch has proper protections
4. **Automated Stale Detection** - Consider implementing GitHub Actions for stale branch detection
5. **Team Communication** - Notify team before bulk deletions

---

**Date Created:** 2026-01-15  
**Purpose:** Repository hygiene and branch management  
**Status:** Ready for execution
