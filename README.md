# Cortex Second Brain

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.98.0-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tests](https://img.shields.io/badge/Tests-206%20passing-22C55E?logo=vitest&logoColor=white)](./TESTING.md)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An AI-powered, offline-capable personal knowledge management Progressive Web App. Capture notes, documents, and web content into a searchable knowledge base, then chat with **TESSA** — your AI assistant — to surface insights across everything you've saved.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **TESSA AI Chat** | Conversational AI assistant over your knowledge base (OpenAI) |
| 📚 **Knowledge Base** | Store notes, documents, web pages, and files with tagging |
| 📥 **Multi-source Import** | CSV, URL scraping, file upload, PDF parsing, plain text, Google Drive |
| 🔍 **Full-text Search** | Fast semantic and keyword search across all content |
| 📴 **Offline Mode** | Service worker caching with background sync queue |
| ⌨️ **Command Palette** | `Ctrl+K` quick access to all app actions |
| 📊 **Admin Dashboard** | Usage monitoring, rate limits, failed-login tracking |
| 🔐 **MFA / TOTP** | Two-factor authentication support |
| 🎨 **Dark / Light Theme** | System-preference aware theming |
| 📱 **Installable PWA** | Add to home screen on mobile and desktop |
| ↩️ **Undo / Redo** | Full operation history for knowledge edits |
| 📧 **Email Backup** | Export and email your data via Resend |
| 📊 **Recharts Analytics** | Visual dashboards for usage and activity |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3.1, TypeScript 5.5.3 |
| Build | Vite 5.4.1 + @vitejs/plugin-react-swc |
| Styling | Tailwind CSS 3.4.11, shadcn/ui (Radix UI) |
| Animation | Framer Motion 12.35.1 |
| Charts | Recharts 2.12.7 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| State | TanStack Query 5.84.1 |
| Routing | React Router 6.26.2 |
| Testing | Vitest 4.0.18 (206 tests) |
| PWA | vite-plugin-pwa 0.19.8 |
| Virtual Lists | @tanstack/react-virtual 3.13.12 |
| Sanitization | DOMPurify 3.2.6 |
| PDF Export | jsPDF 4.2.0 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0 (or Bun)
- A [Supabase](https://supabase.com/) project

### 1. Clone and Install

```bash
git clone https://github.com/your-org/cortex-second-brain.git
cd cortex-second-brain
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

> ⚠️ **Note**: The client uses `VITE_SUPABASE_PUBLISHABLE_KEY`, not `VITE_SUPABASE_ANON_KEY`.

### 3. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

Set required Edge Function secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set GOOGLE_CLIENT_ID=...
supabase secrets set GOOGLE_CLIENT_SECRET=...
```

### 4. Start Development Server

```bash
npm run dev
# → http://localhost:8080
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI |

---

## 📁 Project Structure

```
cortex-second-brain/
├── public/                     # Static assets, PWA icons
├── src/
│   ├── App.tsx                 # Root component & router
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   ├── __tests__/              # Integration tests
│   ├── components/
│   │   ├── admin/              # Admin dashboard components
│   │   ├── auth/               # AuthForm, MFA, ResetPassword
│   │   ├── features/           # Feature-specific components
│   │   ├── knowledge/          # Knowledge base UI
│   │   ├── landing/            # Marketing pages
│   │   ├── layout/             # Shell, sidebar, navbar
│   │   ├── search/             # Search & TESSA chat UI
│   │   ├── settings/           # User settings panels
│   │   ├── tessa/              # TESSA AI components
│   │   └── ui/                 # shadcn/ui primitives
│   ├── config/
│   │   └── app-config.ts       # All VITE_ env vars centralised
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state & Supabase session
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client singleton
│   │       └── types.ts        # Generated DB types
│   ├── lib/                    # Utility libraries
│   ├── pages/                  # Route-level page components
│   ├── services/               # Data access layer (service classes)
│   │   ├── base.service.ts
│   │   ├── knowledge.service.ts
│   │   ├── chat.service.ts
│   │   ├── search.service.ts
│   │   ├── user.service.ts
│   │   ├── notification.service.ts
│   │   ├── admin.service.ts
│   │   └── audit.service.ts
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
├── supabase/
│   ├── functions/              # Edge functions (Deno)
│   │   ├── account-lockout/
│   │   ├── chat-with-tessa-secure/
│   │   ├── google-drive-oauth/
│   │   ├── ip-geolocation/
│   │   ├── parse-pdf/
│   │   ├── security-headers/
│   │   ├── send-backup-email/
│   │   └── system-status/
│   └── migrations/             # SQL migration files
├── e2e/                        # Playwright end-to-end tests
├── docs/                       # Project documentation
│   ├── adr/                    # Architecture Decision Records
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── RUNBOOK.md
│   └── ROADMAP.md
├── .env.example                # Environment variable template
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 🛣️ Application Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/why` | Why Cortex page | Public |
| `/how` | How it works | Public |
| `/auth` | Sign in / Sign up | Public |
| `/reset-password` | Password reset | Public |
| `/status` | System status | Public |
| `/install` | PWA install guide | Public |
| `/offline` | Offline fallback | Public |
| `/dashboard` | Main dashboard | 🔒 Protected |
| `/manage` | Knowledge management | 🔒 Protected |
| `/search` | TESSA AI chat | 🔒 Protected |
| `/tessa` | TESSA page | 🔒 Protected |
| `/import` | Import content | 🔒 Protected |
| `/profile` | User profile | 🔒 Protected |
| `/settings` | App settings | 🔒 Protected |
| `/admin` | Admin dashboard | 👑 Admin only |

---

## 🔐 Authentication

Authentication is handled by Supabase Auth:

- Email/password sign-in with email verification
- TOTP-based Multi-Factor Authentication (MFA)
- Password reset via email
- Sessions persisted in `localStorage` with auto-refresh
- Row Level Security (RLS) enforced on all database tables
- Role-based access control via `user_roles` table (`admin`, `moderator`, `user`)

---

## 🗄️ Database

See [docs/DATABASE.md](docs/DATABASE.md) for full schema documentation.

Core tables: `knowledge_base`, `chats`, `messages`, `user_profiles`, `user_roles`, `notifications`, `filter_presets`

---

## 🌐 Edge Functions

See [docs/API.md](docs/API.md) for full API documentation.

| Function | Trigger | Purpose |
|---|---|---|
| `chat-with-tessa-secure` | POST | AI chat with rate limiting |
| `parse-pdf` | POST multipart | PDF text extraction |
| `send-backup-email` | POST | Email data backup via Resend |
| `account-lockout` | GET/POST | Login attempt tracking |
| `google-drive-oauth` | GET | Google Drive OAuth flow |
| `ip-geolocation` | POST | IP to location lookup |
| `security-headers` | GET | CSP/HSTS header config |
| `system-status` | POST | Health check endpoint |

---

## 🔒 Security

See [docs/SECURITY.md](docs/SECURITY.md) for the full security policy.

- All data protected by Supabase RLS policies
- DOMPurify sanitization for all user-generated HTML
- Account lockout after repeated failed login attempts
- MFA/TOTP support
- Security headers via dedicated edge function
- `Content-Security-Policy`, `HSTS`, `X-Frame-Options` enforced

---

## 🧪 Testing

```bash
npm run test              # Run all 206 tests
npm run test:coverage     # Coverage report (70% threshold)
```

Coverage thresholds: **70% statements**, **65% branches**, **70% functions**, **70% lines**

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

[MIT](LICENSE) © Cortex Second Brain Contributors
