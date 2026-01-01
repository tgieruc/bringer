# src/ – Source Code

This directory contains all application source code for Bringer.

---

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages, layouts, and API routes |
| `components/` | React components (domain-specific and UI primitives) |
| `lib/` | Utilities and Supabase client factories |
| `middleware.ts` | Route protection and authentication enforcement |

---

## Import Conventions

Use the `@/` path alias for all imports from this directory:

```typescript
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

Never use relative imports like `../../lib/` from deep paths.

---

## Key Files

### middleware.ts

Protects routes by checking authentication state:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` to `/`
- Excludes static files and public routes

To add a new public route, update the matcher config in this file.

---

## Cross-References

- See [app/AGENTS.md](app/AGENTS.md) for routing patterns
- See [components/AGENTS.md](components/AGENTS.md) for component guidelines
- See [lib/AGENTS.md](lib/AGENTS.md) for Supabase client usage
