# Changelog

All notable changes to Cortex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
