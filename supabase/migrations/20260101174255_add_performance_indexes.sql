-- Additional performance indexes for better query optimization
-- Generated: 2026-01-01

-- Index for faster item lookups by workspace_id and name_normalized
-- This composite index is more efficient than separate indexes
-- when querying items by both workspace and name
CREATE INDEX IF NOT EXISTS items_workspace_id_name_idx 
  ON items(workspace_id, name_normalized);

-- Index for faster queries filtering unchecked entries
-- Partial index only includes unchecked items (most common query)
CREATE INDEX IF NOT EXISTS shopping_list_entries_checked_idx 
  ON shopping_list_entries(list_id, checked) 
  WHERE checked = false;

-- Index for recipe searches by workspace and title
-- Useful for searching recipes by title within a workspace
CREATE INDEX IF NOT EXISTS recipes_workspace_id_title_idx 
  ON recipes(workspace_id, title);

-- Index for recipe ingredients by recipe_id
-- Already exists: recipe_ingredients_recipe_id_idx
-- Verify it exists and create if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'recipe_ingredients' 
    AND indexname = 'recipe_ingredients_recipe_id_idx'
  ) THEN
    CREATE INDEX recipe_ingredients_recipe_id_idx 
      ON recipe_ingredients(recipe_id);
  END IF;
END $$;

-- Comments for documentation
COMMENT ON INDEX items_workspace_id_name_idx IS 
  'Composite index for fast item lookups by workspace and name_normalized';
COMMENT ON INDEX shopping_list_entries_checked_idx IS 
  'Partial index for unchecked entries - improves active list queries';
COMMENT ON INDEX recipes_workspace_id_title_idx IS 
  'Composite index for recipe search by workspace and title';
