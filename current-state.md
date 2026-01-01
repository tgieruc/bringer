  Current State Summary

  ✅ What's Working:
  - Authentication (magic links via Supabase)
  - Workspace creation and basic management
  - Database RLS policies for workspaces
  - Basic routing structure
  - shadcn/ui component foundation

  ❌ What's Missing:
  - Items system (canonical item catalog)
  - Icons system (Lucide icon mappings)
  - Shopping Lists (all functionality)
  - Recipes (all functionality)
  - User dropdown menu
  - Full mobile responsiveness

  ---
  Phase 1: Items System Foundation 🔧

  Priority: CRITICAL - Required for all other features

  This phase creates the canonical item catalog that both shopping lists and recipes depend on.

  Tasks:
  1. Create items table (supabase/migrations/)
    - Columns: id, workspace_id, name, normalized_name, icon_key, created_at
    - Unique constraint on (workspace_id, normalized_name)
    - RLS policies: users can view/create items in their workspaces
  2. Create icons table (supabase/migrations/)
    - Columns: id, icon_key (Lucide name), description, keywords
    - Seed with ~50 common food/household Lucide icons
    - Global table (not workspace-scoped)
  3. Create get_or_create_item RPC function
    - Input: p_workspace_id UUID, p_name TEXT
    - Logic:
        - Normalize the name (lowercase, trim, collapse spaces)
      - Find existing item by normalized name
      - If not found, create new item with best-match icon
      - Return item ID
    - Security: definer function with proper grants
  4. Generate TypeScript types from schema
    - Run: npx supabase gen types typescript --local > src/lib/database.types.ts
    - Update Supabase clients to use generated types

  Estimated Scope: ~4 migration files, 1 type generation

  ---
  Phase 2: Shopping Lists 🛒

  Depends on: Phase 1

  Tasks:
  1. Create database tables (supabase/migrations/)
    - shopping_lists: id, workspace_id, name, created_by, created_at
    - shopping_list_entries: id, list_id, item_id, note, checked, position
    - RLS policies for both tables
  2. Build Shopping Lists page (src/app/w/[workspaceId]/lists/page.tsx)
    - Display all lists in workspace
    - "Create New List" button → modal/dialog
    - Click list → navigate to list detail view
  3. Create list detail page (src/app/w/[workspaceId]/lists/[listId]/page.tsx)
    - Show all entries with checkboxes
    - Add new item input (autocomplete from existing items)
    - Call get_or_create_item RPC when adding items
    - Delete entries
    - Edit entry notes (quantities)
  4. Build ItemPicker component (src/components/item-picker.tsx)
    - Autocomplete input that searches workspace items
    - Creates new items automatically via RPC
    - Shows icon next to each item
    - Reusable for both lists and recipes

  Estimated Scope: 2 migrations, 3 pages, 2-3 components

  ---
  Phase 3: Recipes 👨‍🍳

  Depends on: Phase 1

  Tasks:
  1. Create database tables (supabase/migrations/)
    - recipes: id, workspace_id, title, instructions, image_url, external_link, created_by, created_at
    - recipe_ingredients: id, recipe_id, item_id, note, position
    - RLS policies for both tables
  2. Build Recipes page (src/app/w/[workspaceId]/recipes/page.tsx)
    - Display all recipes as cards with images
    - "Create New Recipe" button → form page
  3. Create recipe detail/edit page (src/app/w/[workspaceId]/recipes/[recipeId]/page.tsx)
    - Display recipe with ingredients, instructions, image
    - Edit mode with form
    - Add ingredients using ItemPicker component (reused from Phase 2)
    - Optional: image upload to Supabase Storage

  Estimated Scope: 2 migrations, 2 pages, 1 form component

  ---
  Phase 4: UX Polish ✨

  Can be done in parallel with Phase 2/3

  Tasks:
  1. User dropdown menu (src/components/user-menu.tsx)
    - Add dropdown to header layout
    - Show user email
    - "Sign Out" button → calls supabase.auth.signOut()
    - Optional: "Settings" link
  2. Mobile responsiveness audit
    - Test all pages on mobile viewport
    - Ensure sidebar collapses properly
    - Make lists/recipes touch-friendly
    - Add mobile-optimized input controls
    - Test forms on mobile

  Estimated Scope: 1 component, CSS/layout tweaks

  ---
  Technical Considerations

  Icon Matching Strategy:
  - Simple text similarity (PostgreSQL similarity() function with pg_trgm extension)
  - Or fuzzy matching on icon keywords
  - Fallback: first letter avatar if no match

  Auto-creation Flow:
  User types "tomatoes" →
    ItemPicker calls get_or_create_item('tomatoes') →
      Normalizes to "tomatoes" →
        Checks if exists →
          If no: creates item, assigns "tomato" icon →
            Returns item ID

  Mobile-First Decisions:
  - Shopping list entries: large touch targets
  - Item picker: mobile keyboard-friendly
  - Recipes: vertical card layout on small screens

  ---
  Next Steps

  Would you like me to:
  1. Start implementing Phase 1 (Items System) right away?
  2. Review/adjust the plan before starting?
  3. Start with a specific task from the plan?
