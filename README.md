# Tessa AI Platform

<div align="center">

**An intelligent knowledge management and AI assistant platform**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev())
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)](https://supabase.com/)
[![Test Coverage](https://img.shields.io/badge/coverage-70%25+-brightgreen)](https://github.com/Krosebrook/cortex-second-brain-4589/actions/workflows/test.yml)
[![CI](https://github.com/Krosebrook/cortex-second-brain-4589/actions/workflows/test.yml/badge.svg)](https://github.com/Krosebrook/cortex-second-brain-4589/actions/workflows/test.yml)

[Demo](https://lovable.dev/projects/513db1a2-0fcc-4643-bd43-f10d076dfa80) · [Documentation](docs/) · [Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Quick Start Guide](#quick-start-guide)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Changelog](#changelog)
- [License](#license)

---

## Project Overview

Tessa AI is a comprehensive knowledge management and AI assistant platform designed to help users organize, search, and interact with their knowledge base through natural language conversations. Built with modern web technologies, it provides a seamless experience for managing information, collaborating on projects, and leveraging AI capabilities.

### Key Objectives

- **Intelligent Knowledge Management**: Organize and retrieve information efficiently
- **Conversational AI Interface**: Natural language interactions powered by advanced AI models
- **Real-time Collaboration**: Multi-user support with conflict resolution
- **Offline-First Architecture**: Work seamlessly even without internet connectivity
- **Enterprise Security**: Role-based access control with Row Level Security

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Shadcn/UI |
| **State Management** | TanStack Query, React Context |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI Integration** | OpenAI, Anthropic Claude, Google Gemini |
| **Build Tools** | Vite, ESLint, Vitest |
| **Deployment** | Vercel, Netlify, Docker |

---

## Features

### Core Capabilities

- 🤖 **AI-Powered Chat** - Conversational interface with context-aware responses
- 📚 **Knowledge Base** - Organize documents, notes, and resources
- 🔍 **Smart Search** - Full-text search with filters and presets
- 📊 **Dashboard Analytics** - Visualize usage and insights
- 🔐 **Authentication** - Secure login with multiple providers
- 📱 **PWA Support** - Install as a native-like app
- 🌙 **Dark Mode** - System-aware theme switching
- ⌨️ **Keyboard Shortcuts** - Power-user productivity features

### Technical Features

- Optimistic updates with conflict resolution
- Virtual scrolling for large datasets
- Comprehensive error handling and recovery
- Real-time synchronization
- Offline data persistence
- **Web Vitals monitoring** for Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
- **Performance optimizations** for Lighthouse scores >90

---

## Quick Start Guide

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher, v20.x recommended) - [Download](https://nodejs.org/)
- **npm** (v9.0 or higher) - Comes with Node.js
- **Git** (v2.30 or higher) - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/tessa-ai.git
cd tessa-ai
```

2. **Install dependencies**

```bash
npm install
# or
bun install
```

3. **Set up environment variables**

Create a `.env` file in the root directory (copy from `.env.example` if available):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI Provider Keys (configure in Supabase Edge Functions)
# OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key
```

4. **Start the development server**

```bash
npm run dev
# or
bun run dev
```

5. **Open your browser**

Navigate to `http://localhost:8080` to see the application.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Type check without emitting files
npm run type-check
```

### Linting and Code Quality

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Running Tests

```bash
# Run all unit and integration tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage (enforces 70% threshold)
npm run test:coverage

# Run tests with UI (interactive test viewer)
npm run test:ui

# Run E2E tests with Playwright
npx playwright test

# Run E2E tests in UI mode (interactive)
npx playwright test --ui

# View E2E test report
npx playwright show-report
```

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation

| Document | Description |
|----------|-------------|
| [🚀 Product Audit & Launch Roadmap](PRODUCT_AUDIT_AND_ROADMAP.md) | **Executive guide for 3-month launch plan** |
| [Architecture](docs/ARCHITECTURE.md) | System design, component relationships, and data flow |
| [API Reference](docs/API.md) | Edge function endpoints with request/response examples |
| [Deployment Guide](docs/DEPLOYMENT.md) | Instructions for Vercel, Netlify, and self-hosting |
| [Testing Guide](docs/TESTING.md) | Testing strategies, examples, and best practices |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and debugging solutions |
| [Audit Report](docs/AUDIT_REPORT.md) | Comprehensive multi-level audit with recommendations |

### Additional Resources

| Document | Description |
|----------|-------------|
| [Contributing](CONTRIBUTING.md) | Guidelines for code contributions |
| [Changelog](CHANGELOG.md) | Version history and release notes |
| [Technical Whitepaper](docs/TECHNICAL_WHITEPAPER.md) | In-depth technical specifications |
| [Roadmap](docs/ROADMAP.md) | Planned features and improvements |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Pages     │  │ Components  │  │   Hooks & Context   │ │
│  │  (Routes)   │  │  (UI/Logic) │  │  (State Management) │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         └────────────────┼────────────────────┘            │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Services Layer (API Clients)            │   │
│  └──────────────────────────┬──────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │  Auth/Users  │  │  Edge Functions  │  │
│  │  (Database)  │  │   (Auth)     │  │  (Serverless)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs** - Submit detailed bug reports with reproduction steps
- 💡 **Suggest Features** - Share ideas for new functionality
- 📝 **Improve Documentation** - Fix typos, add examples, clarify explanations
- 🔧 **Submit Code** - Fix bugs or implement new features

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Troubleshooting & FAQ

### Common Issues

<details>
<summary><strong>Application won't start</strong></summary>

```bash
# Clear cache and reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```
</details>

<details>
<summary><strong>Data not showing (RLS issues)</strong></summary>

Ensure Row Level Security policies are correctly configured. Check that:
- User is authenticated
- `user_id` column is properly set in insert statements
- RLS policies allow the current operation
</details>

<details>
<summary><strong>Build failures</strong></summary>

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for linting issues
npm run lint -- --fix
```
</details>

<details>
<summary><strong>Authentication redirect issues</strong></summary>

Configure URL settings in Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Set Site URL to your app URL
3. Add redirect URLs for preview and production domains
</details>

### FAQ

**Q: Can I use this with my own AI provider?**  
A: Yes! The AI integration is modular. Configure your provider's API key in Supabase Edge Function secrets.

**Q: Is offline mode fully supported?**  
A: Yes, the app uses IndexedDB for offline storage with automatic sync when connectivity returns.

**Q: How do I reset my local development environment?**  
A: Run `rm -rf node_modules .vite && npm install && npm run dev`

For comprehensive troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Changelog

### Recent Releases

#### v0.3.0 (Latest)
- Added filter presets with persistence
- Implemented keyboard shortcuts system
- Added bulk operations for knowledge items
- Performance optimizations with virtual scrolling

#### v0.2.0
- Knowledge base management
- Real-time sync with conflict resolution
- Offline support with background sync
- Toast notifications with undo support

#### v0.1.0
- Initial release
- Core chat functionality
- User authentication
- Basic dashboard

For complete version history, see [CHANGELOG.md](CHANGELOG.md).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Lovable](https://lovable.dev) - AI-powered web development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

<div align="center">

**[⬆ Back to Top](#tessa-ai-platform)**

Made with ❤️ by the Tessa AI Team

</div>
