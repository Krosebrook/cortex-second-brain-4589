# Changelog

All notable changes to Cortex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2](https://github.com/Krosebrook/cortex-second-brain-4589/compare/v0.1.1...v0.1.2) (2026-02-22)


### Bug Fixes

* apply review feedback - version 0.1.1, revert zod to ^3.23.8 ([c238547](https://github.com/Krosebrook/cortex-second-brain-4589/commit/c238547d78c4276296c63559bda161121ac15bcb))

## 1.0.0 (2026-01-18)


### Features

* add automated branch cleanup workflow and documentation ([52c81a3](https://github.com/Krosebrook/cortex-second-brain-4589/commit/52c81a3b4600db89abc655430d1366d327e83583))
* Add comprehensive audit logging service and security audit documentation ([3d0e222](https://github.com/Krosebrook/cortex-second-brain-4589/commit/3d0e222dd7694a6b9fe0ffe8a1809b988a83a8cf))
* Add test workflow with coverage enforcement and new service modules ([c890a3d](https://github.com/Krosebrook/cortex-second-brain-4589/commit/c890a3db310c1da9b6333e416c82ccaa575c153f))


### Bug Fixes

* Address code review feedback ([2034b62](https://github.com/Krosebrook/cortex-second-brain-4589/commit/2034b621f45cd9ddf955a4ca20e1ab5cb388870f))

## [Unreleased]

### Planned
- Enhanced search with semantic capabilities
- Real-time collaboration features
- Mobile-responsive improvements
- Accessibility enhancements (WCAG 2.1 AA compliance)

---

## [0.3.0] - 2024-12-18

### Added
- Comprehensive API documentation (`docs/API.md`)
- Contributing guidelines (`CONTRIBUTING.md`)
- Architecture documentation (`docs/ARCHITECTURE.md`)
- Getting Started guide in README

### Changed
- Updated README with detailed setup instructions
- Improved project structure documentation
- Enhanced ROADMAP with recent changes section

### Removed
- E-commerce/store management functionality (out of scope)
  - Removed `StoresManager`, `SyncedProductsTable`, `StoreConnectionModal` components
  - Removed database tables: `stores`, `synced_products`, `synced_orders`, `store_sync_logs`
  - Removed `sync-store` edge function
  - Removed `docs/SECURITY_STORES_ENCRYPTION.md`

### Security
- Cleaned up unused store-related RLS policies

---

## [0.2.0] - 2024-12-15

### Added
- Secure chat endpoint with rate limiting (`chat-with-tessa-secure`)
- Input validation and sanitization for chat messages
- Chat ownership verification
- System status endpoint for health monitoring
- Offline support with service worker
- PWA manifest and install prompts
- Connection status indicators
- Conflict detection and resolution system

### Changed
- Enhanced error handling across edge functions
- Improved toast notifications with undo support
- Better loading states and progress indicators

### Fixed
- Session persistence issues in authentication
- Chat scroll behavior on new messages
- Filter preset ordering and drag-and-drop

---

## [0.1.0] - 2024-12-01

### Added
- Initial release of Cortex knowledge management platform
- **Core Features:**
  - Knowledge base management (notes, documents, web pages)
  - AI chat interface (Tessa) powered by OpenAI
  - Import system for external content
  - Search and filtering with saved presets
  - Tag-based organization

- **Authentication:**
  - Email/password authentication via Supabase Auth
  - Protected routes and session management
  - User profiles

- **UI Components:**
  - Responsive navigation with mobile support
  - Dark/light theme toggle
  - Toast notifications
  - Loading states and skeletons
  - Dialog and modal system

- **Backend:**
  - Supabase database integration
  - Edge functions for AI chat
  - Row Level Security policies
  - Real-time subscriptions

- **Developer Experience:**
  - TypeScript throughout
  - Tailwind CSS with design system
  - shadcn/ui component library
  - Vitest for testing
  - ESLint configuration

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.3.0 | 2024-12-18 | Documentation improvements, scope cleanup |
| 0.2.0 | 2024-12-15 | Security enhancements, offline support |
| 0.1.0 | 2024-12-01 | Initial release |

---

## Migration Notes

### Upgrading to 0.3.0

No breaking changes. E-commerce features were removed but were not part of the public API.

### Upgrading to 0.2.0

- Update Supabase client to use new secure chat endpoint for production
- Review rate limiting configuration if customization needed

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to propose changes and submit pull requests.
