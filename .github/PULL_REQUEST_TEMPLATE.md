## Summary

<!-- Provide a concise summary of what this PR does and why -->



## Type of Change

<!-- Mark the appropriate option(s) with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update (formatting, styling, no logic change)
- [ ] ♻️ Refactor (code change that neither fixes a bug nor adds a feature)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update (adding or updating tests)
- [ ] 🔧 Configuration / infrastructure change
- [ ] 🔒 Security fix

## What Changed

<!-- List every meaningful change introduced by this PR. Be specific. -->

- 
- 
- 

## Testing

<!-- Describe how you verified these changes work correctly -->

### Test Coverage

- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] E2E tests added / updated
- [ ] Manual testing performed

### How to Reproduce / Verify

<!-- Step-by-step instructions a reviewer can follow to manually verify the change -->

1. 
2. 
3. 

### Test Configuration

- **Browser(s)**:
- **Device(s)**:

## Security Impact

<!--
  Does this PR touch authentication, authorisation, secrets handling, user-input
  processing, cryptography, or any security-sensitive subsystem?

  If YES — add the label `security-review` to this PR.
  The @security-review team will be automatically requested for review.
  CI will fail until a member of @security-review approves.

  Answer each question below:
-->

- [ ] This PR modifies authentication or authorisation logic
- [ ] This PR touches secrets, credentials, or environment variable handling
- [ ] This PR changes input validation, sanitisation, or output encoding
- [ ] This PR modifies RLS policies or database access control
- [ ] This PR introduces or changes cryptographic operations
- [ ] This PR has **no** security impact (skip security review)

**Security notes** (required if any box above is checked):

<!-- Explain the security implications and any mitigations applied -->

## Rollback Plan

<!-- How do we revert this change if it causes issues in production?
     For trivial changes (docs, config tweaks) you may write "Revert commit". -->



## Checklist

### Author

- [ ] Self-review completed — I have read through every changed line
- [ ] Code follows project conventions (`@/` imports, `async/await`, `ApplicationError`, etc.)
- [ ] No new lint errors or TypeScript warnings introduced (`npm run lint && npm run type-check`)
- [ ] Tests pass locally (`npm run test`)
- [ ] No secrets, credentials, or personally-identifiable data committed
- [ ] `dangerouslySetInnerHTML` only used with DOMPurify sanitisation (if applicable)
- [ ] New Supabase tables include RLS policies (if applicable)
- [ ] Documentation updated (if behaviour or API changed)
- [ ] CHANGELOG.md updated (if user-facing change)

### Reviewer

- [ ] Code logic is correct and complete
- [ ] Tests adequately cover the change
- [ ] No security concerns introduced (or `security-review` label applied)
- [ ] No sensitive data exposed in logs, responses, or comments
- [ ] Breaking changes are documented and communicated
