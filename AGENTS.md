# Bringer – Agent Instructions

This repository is an early-stage web application called **Bringer**.
Agents working on this repo should follow the instructions below strictly.

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- shadcn/ui (Radix UI–based components)
- Tailwind CSS (only as required by shadcn)
- Supabase (Auth, Postgres, Storage)
- Supabase is used both locally and hosted later

---

## Environment & Secrets

- Supabase runs locally during development.
- Only the **Publishable (anon) key** may be used in frontend code.
- **NEVER** use or commit the Supabase Secret key in frontend code.
- `.env.local` must be gitignored.
- Auth uses Supabase Auth (magic link by default).

Local Supabase defaults:
- Project URL: http://127.0.0.1:54321
- Mailpit (for magic links): http://127.0.0.1:54324

---

## Architectural Rules

### Frontend
- This is a **responsive web app**, not a native app.
- UI must work well on laptop and mobile.
- Use shadcn/ui components whenever possible.
- Avoid raw Tailwind styling unless necessary for layout.
- Keep layouts simple and readable.

### Routing
- `/login` → authentication
- `/` → redirect to workspace or login
- `/w/[workspaceId]/lists`
- `/w/[workspaceId]/recipes`

### Auth & Data Access
- Prefer **Server Components**.
- Use **Client Components only when necessary** (forms, toasts, interactive UI).
- Protected routes must redirect unauthenticated users to `/login`.
- Workspace-based access model:
  - Users belong to workspaces.
  - All domain objects are workspace-scoped.

### Supabase
- Use separate clients:
  - `src/lib/supabase/client.ts` (browser)
  - `src/lib/supabase/server.ts` (server)
- Do not bypass Supabase Auth.
- Do not implement RLS policies in frontend code.

---

## Domain Model (Conceptual)

- Workspaces (shared ownership boundary)
- Workspace members (owner/editor/viewer)
- Items (workspace-scoped canonical items)
- Shopping lists (workspace-scoped)
- Recipes (workspace-scoped)
- Icons:
  - Lucide icon set only
  - Icons are global (not workspace-specific)

Agents should NOT invent new domain entities without discussion.

---

## UI & UX Rules

- Items are created automatically when users type custom text.
- Icons are auto-assigned based on name similarity.
- If no icon exists, fallback to a letter avatar.
- Quantities/notes are free-form text.

Do not add “smart parsing” or AI features unless explicitly requested.

---

## Coding Style

- Prefer clarity over cleverness.
- Avoid premature abstractions.
- Add TODO comments instead of speculative implementations.
- Keep functions small and readable.
- Do not introduce new libraries without strong justification.

---

## What NOT to do

- Do not add mock or fake data.
- Do not hardcode user IDs or workspace IDs.
- Do not introduce global state libraries.
- Do not create multiple competing patterns for auth or layout.
- Do not refactor large parts of the app unless explicitly asked.

---

## Expected Agent Output

When making changes, agents should:
1. Modify only what is necessary.
2. Explain what was changed and why.
3. Ensure the app still runs with `npm run dev`.

---

## Questions & Uncertainty

If a task is ambiguous:
- Make the smallest reasonable assumption.
- Leave a TODO explaining the assumption.
- Do NOT invent product decisions.
