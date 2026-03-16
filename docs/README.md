# Tessa AI Platform — Documentation Index

**Last Updated**: 2026-03-16 · **Owner**: Tech Lead

---

## Quick Start

👉 **New to Tessa?** Start here:
1. [README](../README.md) — Project overview and quick start
2. [Onboarding Checklist](ONBOARDING_CHECKLIST.md) — Day 1–5 guide for new developers
3. [Architecture Overview](ARCHITECTURE.md) — Understand the system

👉 **Developers**: See [Developer Guide](DEVELOPER_GUIDE.md) and [Development Guide](DEVELOPMENT.md)
👉 **Operators/SRE**: See [Runbook](RUNBOOK.md) and [Observability](OBSERVABILITY.md)
👉 **Security**: See [Security Documentation](SECURITY.md)

---

## Documentation by Category

### 🎯 Production Readiness

| Document | Status | Priority | Description |
|---|---|---|---|
| [Database Schema](DATABASE_SCHEMA.md) | ✅ Complete | P0 | Tables, RLS policies, indexes, migrations |
| [Failure Modes](FAILURE_MODES.md) | ✅ Complete | P0 | Feature failure scenarios and recovery |
| [Observability](OBSERVABILITY.md) | ✅ Complete | P0 | Logging, metrics, alerting, dashboards |
| [Runbook](RUNBOOK.md) | ✅ Complete | P0 | Operational procedures, incident response |
| [Error Handling Guide](ERROR_HANDLING_GUIDE.md) | ✅ Complete | P0 | Error taxonomy, patterns, recovery |
| [Configuration Management](CONFIGURATION_MANAGEMENT.md) | ✅ Complete | P1 | Environment variables, secrets, feature flags |
| [Incident Response](INCIDENT_RESPONSE.md) | ✅ Complete | P0 | Incident severity, response, post-mortem |
| [Production Readiness](PRODUCTION_READINESS.md) | ✅ Complete | P0 | Production readiness checklist |

### 🏗️ Architecture & Design

| Document | Status | Description |
|---|---|---|
| [Architecture](ARCHITECTURE.md) | ✅ Complete | System design and component relationships |
| [Technical Whitepaper](TECHNICAL_WHITEPAPER.md) | ✅ Complete | In-depth technical specifications |
| [Documentation Framework](DOCUMENTATION_FRAMEWORK.md) | ✅ Complete | Documentation strategy, standards, templates |
| [ADRs](adr/) | ✅ Complete | Architecture Decision Records (8 decisions) |

### 🔌 API Documentation

| Document | Status | Description |
|---|---|---|
| [API Reference](API.md) | ✅ Complete | Edge function endpoints and examples |
| [OpenAPI Specification](openapi.yaml) | ✅ Complete | Machine-readable REST API spec |
| [Interactive API Docs](api.html) | ✅ Complete | Swagger UI for API exploration |

### 🚀 Deployment & Operations

| Document | Status | Description |
|---|---|---|
| [Deployment Guide](DEPLOYMENT.md) | ✅ Complete | Deploy to Vercel, Netlify, self-hosted |
| [CI/CD Pipeline](CICD.md) | ✅ Complete | GitHub Actions workflows and deployment gates |
| [Release Policy](RELEASE_POLICY.md) | ✅ Complete | SemVer rules, branching, release process |
| [Troubleshooting](TROUBLESHOOTING.md) | ✅ Complete | Common issues and debugging steps |
| [Branch Management](BRANCH_MANAGEMENT.md) | ✅ Complete | Git branching strategy and lifecycle |
| [Branch Cleanup Plan](BRANCH_CLEANUP_PLAN.md) | ✅ Complete | Stale branch cleanup procedures |

### 🧪 Testing & Quality

| Document | Status | Description |
|---|---|---|
| [Testing Guide](TESTING.md) | ✅ Complete | Unit, integration, E2E testing strategy |
| [Best Practices](BEST_PRACTICES.md) | ✅ Complete | Coding conventions and quality standards |
| [Dead Code Triage](DEAD_CODE_TRIAGE.md) | ✅ Complete | Dead code audit and triage findings |

### 🔒 Security

| Document | Status | Description |
|---|---|---|
| [Security Guide](SECURITY.md) | ✅ Complete | Auth, RLS, secrets, data protection |
| [Security Audit](SECURITY_AUDIT.md) | ✅ Complete | Security audit findings and recommendations |

### 👩‍💻 Developer Resources

| Document | Status | Description |
|---|---|---|
| [Developer Guide](DEVELOPER_GUIDE.md) | ✅ Complete | Coding conventions, patterns, workflows |
| [Development Guide](DEVELOPMENT.md) | ✅ Complete | Local development setup and tools |
| [Onboarding Checklist](ONBOARDING_CHECKLIST.md) | ✅ Complete | New developer Day 1–5 checklist |
| [Mentor Guidance](MENTOR_GUIDANCE.md) | ✅ Complete | Guidance for mentors and senior developers |
| [Implementation Summary](IMPLEMENTATION_SUMMARY.md) | ✅ Complete | Summary of implementation decisions |
| [Contributors](CONTRIBUTORS.md) | ✅ Complete | Project contributors and attributions |

### 📋 Project Management

| Document | Status | Description |
|---|---|---|
| [Roadmap](ROADMAP.md) | ✅ Complete | Planned features and timeline |
| [Product Audit & Roadmap](PRODUCT_AUDIT_AND_ROADMAP.md) | ✅ Complete | Executive product strategy and launch plan |
| [PRD](PRD.md) | ✅ Complete | Product requirements document |
| [Changelog](../CHANGELOG.md) | ✅ Complete | Version history (auto-maintained) |

### 📊 Audit & Reports

| Document | Status | Description |
|---|---|---|
| [Audit Summary](AUDIT_SUMMARY.md) | ✅ Complete | High-level codebase audit summary |
| [Audit Report](AUDIT_REPORT.md) | ✅ Complete | Comprehensive spec-driven audit report |
| [Audit Report (Brief)](AUDIT_REPORT_BRIEF.md) | ✅ Complete | Concise codebase audit findings |
| [Documentation Audit Report](DOCUMENTATION_AUDIT_REPORT.md) | ✅ Complete | Full documentation audit analysis |
| [Documentation Audit Summary](DOCUMENTATION_AUDIT_SUMMARY.md) | ✅ Complete | Documentation audit quick reference |

---

## Documentation by Audience

### For New Developers
1. [README](../README.md)
2. [Onboarding Checklist](ONBOARDING_CHECKLIST.md)
3. [Developer Guide](DEVELOPER_GUIDE.md)
4. [Development Guide](DEVELOPMENT.md)
5. [Architecture](ARCHITECTURE.md)
6. [Database Schema](DATABASE_SCHEMA.md)
7. [Testing Guide](TESTING.md)
8. [Contributing Guide](../CONTRIBUTING.md)

### For Backend / Full-Stack Developers
- [API Reference](API.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md)
- [Configuration Management](CONFIGURATION_MANAGEMENT.md)

### For DevOps / SRE Engineers
- [Deployment Guide](DEPLOYMENT.md)
- [CI/CD Pipeline](CICD.md)
- [Runbook](RUNBOOK.md)
- [Observability](OBSERVABILITY.md)
- [Failure Modes](FAILURE_MODES.md)
- [Incident Response](INCIDENT_RESPONSE.md)

### For Security Engineers
- [Security Guide](SECURITY.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Database Schema](DATABASE_SCHEMA.md) — RLS Policy Matrix section
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md) — §12 Security Coding Guidelines

### For Product Managers
- [Product Audit & Roadmap](PRODUCT_AUDIT_AND_ROADMAP.md)
- [Roadmap](ROADMAP.md)
- [PRD](PRD.md)
- [Release Policy](RELEASE_POLICY.md)
- [Changelog](../CHANGELOG.md)

---

## Documentation Standards

All documents include:
- Version, last-updated date, and owner in the header.
- Table of contents for documents > 3 sections.
- Code blocks with language tags.
- Tables for comparisons and reference data.

For the full documentation strategy — standards, templates, update plan, and maintenance cadence — see [Documentation Framework](DOCUMENTATION_FRAMEWORK.md).

---

## Contributing to Documentation

1. **Found an error?** Submit a PR with corrections.
2. **Missing information?** Open an issue or update the relevant doc.
3. **New feature?** Update the relevant doc(s) in the same PR as the code change.

See [Documentation Framework §7](DOCUMENTATION_FRAMEWORK.md#7-validation-and-maintenance-strategy) for trigger events and maintenance cadence.

---

## Related Resources

- [GitHub Repository](https://github.com/Krosebrook/cortex-second-brain-4589)
- [Live Demo](https://lovable.dev/projects/513db1a2-0fcc-4643-bd43-f10d076dfa80)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)

---

**Next Review**: 2026-06-16

