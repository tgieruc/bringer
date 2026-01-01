# supabase/ – Database & Backend

This directory contains Supabase configuration, migrations, and seed data.

---

## Files

| File | Purpose |
|------|---------|
| `config.toml` | Local Supabase configuration |
| `seed.sql` | Seed data for development |
| `migrations/` | Database schema migrations |
| `snippets/` | Reusable SQL snippets |

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `workspaces` | Shared ownership boundary | id, owner_id, name |
| `workspace_members` | User-workspace membership | workspace_id, user_id, role |
| `items` | Canonical item catalog | workspace_id, name, normalized_name, icon_key |
| `icons` | Global icon definitions | icon_key, description, keywords |
| `shopping_lists` | Shopping lists | workspace_id, name |
| `shopping_list_entries` | Items in a list | list_id, item_id, note, checked, position |
| `recipes` | Recipe definitions | workspace_id, title, instructions |
| `recipe_ingredients` | Recipe items | recipe_id, item_id, note, position |

### Relationships

- All domain tables are **workspace-scoped**
- Items link to icons via `icon_key`
- List entries and recipe ingredients link to items via `item_id`

---

## Key RPC Functions

### create_workspace_with_owner(name, owner_id)

Creates a workspace and adds the owner as a member atomically.

```typescript
const { data } = await supabase.rpc('create_workspace_with_owner', {
  workspace_name: 'My Workspace',
  owner_user_id: user.id
})
```

### get_or_create_item(workspace_id, item_name)

Returns existing item or creates a new one with auto-assigned icon.

```typescript
const { data: itemId } = await supabase.rpc('get_or_create_item', {
  p_workspace_id: workspaceId,
  p_name: 'Apples'
})
```

---

## RLS Policy Conventions

All tables use Row Level Security. Patterns:

1. **Workspace membership check**: Users can only access data in workspaces where they're members
2. **Role-based permissions**: 
   - `owner` can delete workspaces
   - `editor` can modify data
   - `viewer` can only read

Example policy pattern:
```sql
CREATE POLICY "Users can view items in their workspaces"
ON items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = items.workspace_id
    AND user_id = auth.uid()
  )
);
```

---

## Creating New Migrations

```bash
npx supabase migration new <migration_name>
```

This creates a timestamped file in `migrations/`.

### Migration Guidelines

1. One logical change per migration
2. Include RLS policies for new tables
3. Add indexes for frequently queried columns
4. Use `IF NOT EXISTS` for idempotency
5. Test locally before pushing

---

## Local Development Commands

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (reapply all migrations + seed)
npx supabase db reset

# View local Supabase status
npx supabase status

# Open local Supabase Studio
# http://127.0.0.1:54323
```

### Local URLs

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Mailpit (emails) | http://127.0.0.1:54324 |

---

## Cross-References

- See [../src/lib/AGENTS.md](../src/lib/AGENTS.md) for Supabase client usage
- See [../src/lib/database.types.ts](../src/lib/database.types.ts) for generated types
