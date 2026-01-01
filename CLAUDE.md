# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build production bundle
npm run lint         # Run ESLint
```

### Supabase Local Development
```bash
npx supabase start   # Start local Supabase (Postgres, Auth, Storage)
npx supabase stop    # Stop local Supabase
npx supabase status  # View connection info (URL, anon key, service_role key)
npx supabase db reset # Reset database and re-run all migrations
```

**Important URLs:**
- App: http://localhost:3000
- Supabase API: http://127.0.0.1:54321
- Mailpit (magic link emails): http://127.0.0.1:54324

### Database Migrations
```bash
npx supabase migration new <migration_name>  # Create new migration file
npx supabase db reset                        # Apply all migrations from scratch
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui components (Radix UI primitives + Tailwind CSS)
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Auth**: Supabase Auth with magic links
- **State**: React Server Components preferred; Client Components only when necessary

### Critical Architectural Patterns

#### Supabase Client Separation
Two separate Supabase client implementations exist and must NOT be confused:

- **Server**: `src/lib/supabase/server.ts` - for Server Components and Server Actions
- **Client**: `src/lib/supabase/client.ts` - for Client Components only

Both use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (never the secret key in frontend code).

#### Authentication Flow
1. Middleware (`src/middleware.ts`) enforces auth on all routes except `/login`, `/auth/*`
2. Authenticated users on `/login` redirect to `/`
3. Unauthenticated users redirect to `/login`
4. Magic link callback handled at `/auth/callback`

#### Workspace-Based Access Model
All domain data is workspace-scoped:
- Users belong to one or more workspaces via `workspace_members` table
- Each workspace has an owner and optional editors/viewers
- RLS policies enforce workspace boundaries
- When creating a workspace, a trigger automatically adds the creator as owner

#### Route Structure
```
/login                          → Auth page
/                               → Workspace selector or create workspace form
/w/[workspaceId]/lists          → Shopping lists (planned)
/w/[workspaceId]/recipes        → Recipes (planned)
```

#### Database Schema
Key tables (see `supabase/migrations/`):
- `workspaces` - each workspace has `owner_id`, `name`
- `workspace_members` - junction table with `role` (owner/editor/viewer)
- Trigger `on_workspace_created` auto-inserts owner into `workspace_members`

RLS policies enforce:
- Users can only view/modify workspaces they're members of
- Only owners can update/delete workspaces
- Only owners can modify workspace members

### Component Patterns

#### Server Components (Default)
Fetch data directly in async components:
```tsx
const supabase = await createClient() // server.ts
const { data } = await supabase.from('workspaces').select('*')
```

#### Client Components (When Needed)
Use `'use client'` directive for:
- Forms with state/interaction
- Toast notifications (sonner)
- Interactive UI (dropdowns, modals)

### Important Constraints

**DO NOT:**
- Hardcode user IDs or workspace IDs
- Use the Supabase secret key in frontend code (only anon key)
- Bypass RLS by implementing access control in frontend
- Add global state libraries (Zustand, Redux, etc.)
- Create multiple auth patterns
- Add mock/fake data
- Introduce new libraries without strong justification

**DO:**
- Keep Server Components as the default
- Use shadcn/ui components when available
- Follow workspace-scoped data access
- Rely on RLS policies for security
- Keep functions small and readable
- Add TODO comments for future work instead of speculative code

### Domain Model (Current)
- **Workspaces**: Shared ownership boundary
- **Workspace Members**: User-workspace relationships with roles
- **Items**: (Planned) Workspace-scoped canonical items
- **Shopping Lists**: (Planned) Workspace-scoped
- **Recipes**: (Planned) Workspace-scoped

Do NOT invent new domain entities without discussion.

### Environment Variables
Copy `.env.local.example` to `.env.local` (gitignored):
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from npx supabase status>
```

### Path Aliases
`@/*` maps to `src/*` (configured in `tsconfig.json`)

## Project-Specific Rules

See `AGENTS.md` for comprehensive coding style and architectural rules. Key highlights:
- Responsive web app (laptop + mobile)
- Prefer clarity over cleverness
- Avoid premature abstractions
- Make smallest reasonable assumptions when task is ambiguous
- Leave TODO comments for uncertain decisions
