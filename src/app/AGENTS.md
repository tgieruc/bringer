# app/ – Routes & Pages

This directory defines the URL structure using Next.js App Router conventions.

---

## Route Structure

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Root redirect to workspace or workspace creation |
| `/login` | `login/page.tsx` | Magic link authentication |
| `/auth/callback` | `auth/callback/route.ts` | OAuth/magic link handler |
| `/w/[workspaceId]/lists` | Workspace lists index |
| `/w/[workspaceId]/lists/[listId]` | Shopping list detail |
| `/w/[workspaceId]/recipes` | Workspace recipes index |
| `/w/[workspaceId]/recipes/new` | Create new recipe |
| `/w/[workspaceId]/recipes/[recipeId]` | Recipe detail |

---

## Server vs Client Components

**Default to Server Components.** Only use Client Components when necessary.

### Use Server Components for:
- Data fetching from Supabase
- Layout structure
- Static content
- Auth checks and redirects

### Use Client Components (`"use client"`) for:
- Forms with user input
- Interactive UI (toggles, dropdowns, drag-drop)
- Toast notifications (sonner)
- Real-time updates

---

## Authentication Pattern

1. `middleware.ts` checks auth state on every request
2. Protected pages verify workspace membership:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: membership } = await supabase
  .from('workspace_members')
  .select('role')
  .eq('workspace_id', workspaceId)
  .eq('user_id', user.id)
  .single()

if (!membership) {
  redirect('/')
}
```

---

## Dynamic Route Parameters

Next.js 16 uses async params. Always await them:

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  // ...
}
```

---

## Adding New Routes

1. Create folder matching URL segment (e.g., `settings/`)
2. Add `page.tsx` for the route content
3. Add `layout.tsx` if shared layout is needed
4. For dynamic segments, use `[paramName]/` folder naming
5. Update middleware if route should be public

---

## Cross-References

- See [../components/AGENTS.md](../components/AGENTS.md) for component patterns
- See [../lib/AGENTS.md](../lib/AGENTS.md) for Supabase client usage
