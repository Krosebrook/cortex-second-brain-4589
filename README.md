# Cortex - AI-Powered Knowledge Management

Cortex is an AI-powered second brain platform that helps you capture, organize, and retrieve knowledge effortlessly.

## 🚀 Getting Started

### Quick Start (5 minutes)

1. **Visit the App**: Go to the [live application](https://lovable.dev/projects/513db1a2-0fcc-4643-bd43-f10d076dfa80) or your deployed URL
2. **Create an Account**: Sign up with email or use social authentication
3. **Start Adding Knowledge**: 
   - Click "Import" to add notes, documents, or web pages
   - Use the AI chat (Tessa) to ask questions about your knowledge base
   - Organize with tags and views (Table, Grid, List, Kanban)

### First Steps

| Step | Action | Result |
|------|--------|--------|
| 1 | Create your first note | Add a knowledge item manually |
| 2 | Import a webpage | Save content from any URL |
| 3 | Ask Tessa a question | Get AI-powered insights |
| 4 | Organize with tags | Categorize your knowledge |
| 5 | Try different views | Find your preferred layout |

### Key Features

- **📝 Knowledge Management**: Notes, documents, web clippings with multi-view support
- **🤖 AI Chat (Tessa)**: Intelligent assistant for knowledge queries
- **📥 Import System**: Multiple methods to capture information
- **🔍 Search & Filter**: Find anything quickly with powerful filters
- **📱 PWA Support**: Install as an app on any device
- **🔒 Offline-First**: Works without internet, syncs when connected

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun package manager

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase (required for backend features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── hooks/          # Custom React hooks
├── services/       # API and business logic
├── contexts/       # React context providers
├── lib/            # Utility functions
├── types/          # TypeScript type definitions
└── integrations/   # Third-party integrations (Supabase)
```

---

## 🔧 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router v6

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Lint codebase |

---

## 🚢 Deployment

### Via Lovable (Recommended)
Open [Lovable](https://lovable.dev/projects/513db1a2-0fcc-4643-bd43-f10d076dfa80) and click Share → Publish.

### Self-Hosting
See [Self-hosting documentation](https://docs.lovable.dev/tips-tricks/self-hosting) for deploying to your own infrastructure.

### Custom Domain
Visit [Custom domains documentation](https://docs.lovable.dev/tips-tricks/custom-domain/) for setup instructions.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📚 Documentation

- [Technical Whitepaper](docs/TECHNICAL_WHITEPAPER.md)
- [Product Roadmap](docs/ROADMAP.md)
- [Lovable Documentation](https://docs.lovable.dev/)

---

## 📄 License

This project is private. All rights reserved.
