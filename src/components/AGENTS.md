# components/ – React Components

This directory contains all React components: domain-specific and UI primitives.

---

## Directory Structure

| Path | Purpose |
|------|---------|
| `*.tsx` | Domain-specific components (forms, lists, navigation) |
| `ui/` | shadcn/ui primitive components (button, card, input, etc.) |

---

## Domain Components

| Component | Purpose | Type |
|-----------|---------|------|
| `create-workspace-form.tsx` | Workspace creation form | Client |
| `create-list-form.tsx` | Shopping list creation | Client |
| `list-entries.tsx` | Interactive list with add/check/delete | Client |
| `recipe-form.tsx` | Recipe create/edit with ingredients | Client |
| `user-menu.tsx` | User dropdown with sign-out | Client |
| `mobile-nav.tsx` | Mobile hamburger navigation | Client |
| `providers.tsx` | Theme provider wrapper | Client |

---

## Client Component Patterns

All domain components are Client Components for interactivity.

### Props Pattern

Components receive `workspaceId` for Supabase queries:

```typescript
interface Props {
  workspaceId: string
  // other props...
}
```

### Toast Notifications

Use `sonner` for user feedback:

```typescript
import { toast } from 'sonner'

toast.success('Item added')
toast.error('Something went wrong')
```

### Navigation After Mutations

Use `useRouter` to refresh data after mutations:

```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()
router.refresh() // Revalidates Server Component data
```

---

## shadcn/ui Components (ui/)

These are auto-generated. **Do not modify directly.**

### Adding New Components

```bash
npx shadcn@latest add <component-name>
```

Examples:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add tabs
```

### Available Components

button, card, dropdown-menu, input, label, separator, skeleton, sonner

### Styling with cn()

Use the `cn` utility to merge Tailwind classes:

```typescript
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class')} />
```

---

## Creating New Components

1. Determine if it's a domain component or UI primitive
2. For UI primitives, use `npx shadcn@latest add`
3. For domain components:
   - Add `"use client"` directive if interactive
   - Accept `workspaceId` prop if workspace-scoped
   - Use Supabase browser client for data operations
   - Use `toast` for user feedback
   - Call `router.refresh()` after mutations

---

## Cross-References

- See [../lib/AGENTS.md](../lib/AGENTS.md) for Supabase client usage
- See [../app/AGENTS.md](../app/AGENTS.md) for where components are used
