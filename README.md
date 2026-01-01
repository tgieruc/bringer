# Bringer

A collaborative web application for managing shopping lists and recipes with shared, canonical item catalogs.

## Features

- 🛒 **Shopping Lists** - Create and manage multiple shopping lists with automatic item creation
- 👨‍🍳 **Recipes** - Store recipes with ingredients, instructions, and images
- 🏢 **Workspaces** - Share lists and recipes with household members or teams
- 🔍 **Smart Items** - Automatic icon matching and deduplication for ingredients
- 🔐 **Secure** - Email magic link authentication with row-level security
- 📱 **Responsive** - Works seamlessly on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest + Playwright

## Prerequisites

- Node.js 20+
- npm or pnpm
- Docker Desktop (for local Supabase)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bringer.git
cd bringer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start local Supabase

```bash
npx supabase start
```

This will start local Supabase services. Note the credentials shown:
- API URL: `http://127.0.0.1:54321`
- Anon key: (copy this for next step)
- Mailpit URL: `http://127.0.0.1:54324` (for viewing magic link emails)

### 4. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials from the previous step:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Access magic link emails

During local development, magic link emails are sent to Mailpit at:
[http://127.0.0.1:54324](http://127.0.0.1:54324)

## Development

### Project Structure

```
bringer/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── login/        # Authentication
│   │   └── w/            # Workspace routes
│   │       └── [workspaceId]/
│   │           ├── lists/    # Shopping lists
│   │           └── recipes/  # Recipes
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utilities and helpers
│       └── supabase/    # Supabase clients
├── supabase/
│   └── migrations/      # Database migrations
├── tests/
│   ├── components/      # Component tests (Vitest)
│   └── e2e/            # End-to-end tests (Playwright)
└── public/             # Static assets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit/component tests
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run end-to-end tests
```

### Database Management

```bash
npx supabase status          # View running services
npx supabase db reset        # Reset local database
npx supabase migration new   # Create new migration
npx supabase db push         # Push migrations to remote
```

### Testing

Run component tests:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Architecture

### Data Model

- **Workspaces**: Sharing boundary for all data
- **Items**: Canonical catalog of ingredients/products (workspace-scoped)
- **Shopping Lists**: Collections of items with notes and checked status
- **Recipes**: Collections of items with instructions and images
- **Icons**: Global icon mappings (Lucide icons)

### Key Features

#### Automatic Item Creation
When you type an item name, the system:
1. Normalizes the name (lowercase, trim, collapse spaces)
2. Checks if it already exists in the workspace
3. If not found, creates it with an auto-matched icon
4. Returns the canonical item ID

#### Icon Matching
Uses PostgreSQL `pg_trgm` similarity to match item names with icon descriptions. Fallback to letter avatar if no good match found.

#### Row Level Security
All database tables use RLS policies based on workspace membership. Users can only access data from workspaces they belong to.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Deploy!

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed contribution guidelines and architecture rules.

### Quick Guidelines

1. Follow the coding style in the codebase
2. Write tests for new features
3. Update documentation
4. Run `npm run lint` before committing
5. Keep changes small and focused

## Documentation

- [AGENTS.md](./AGENTS.md) - Architecture and agent guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Improvement recommendations
- [spec.md](./spec.md) - Product specification

## License

MIT

## Support

For questions or issues, please open a GitHub issue.

