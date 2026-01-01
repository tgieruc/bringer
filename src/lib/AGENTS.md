# lib/ – Utilities & Supabase Clients

This directory contains shared utilities and Supabase client factories.

---

## Files

| File | Purpose |
|------|---------|
| `utils.ts` | `cn()` utility for Tailwind class merging |
| `supabase/client.ts` | Browser Supabase client (Client Components) |
| `supabase/server.ts` | Server Supabase client (Server Components) |
| `database.types.ts` | Auto-generated TypeScript types from Supabase schema |

---

## Supabase Client Usage

**CRITICAL: Never mix server and browser clients.**

### Server Components / Route Handlers

```typescript
import { createClient } from '@/lib/supabase/server'

// In async Server Component or Route Handler:
const supabase = await createClient()
const { data } = await supabase.from('items').select('*')
```

### Client Components

```typescript
import { createClient } from '@/lib/supabase/client'

// In Client Component (synchronous):
const supabase = createClient()
const { data } = await supabase.from('items').select('*')
```

### Key Differences

| Aspect | Server | Client |
|--------|--------|--------|
| Import | `@/lib/supabase/server` | `@/lib/supabase/client` |
| Creation | `await createClient()` | `createClient()` |
| Context | Server Components, Route Handlers | Client Components |
| Cookies | Server-side cookie access | Browser cookie access |

---

## Regenerating Database Types

When the database schema changes (new migrations), regenerate types:

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Or from remote:
```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

---

## cn() Utility

Merges Tailwind classes with proper precedence:

```typescript
import { cn } from '@/lib/utils'

cn('px-4 py-2', isActive && 'bg-blue-500', className)
```

Uses `clsx` + `tailwind-merge` under the hood.

---

## Security

- **Never expose the Supabase secret key** in frontend code
- Only the publishable (anon) key is used in both clients
- RLS policies enforce data access at the database level

---

## Cross-References

- See [../../supabase/AGENTS.md](../../supabase/AGENTS.md) for database schema
- See [../components/AGENTS.md](../components/AGENTS.md) for component usage
