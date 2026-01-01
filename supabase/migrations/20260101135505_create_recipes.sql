-- Create recipes tables
-- Recipes contain ordered ingredients referencing items

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT DEFAULT '', -- Plain text or markdown
  image_url TEXT, -- Optional recipe image
  external_link TEXT, -- Optional link to original recipe
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe ingredients table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  note TEXT DEFAULT '', -- Free-form text for quantity, preparation, etc.
  position INTEGER NOT NULL, -- For ordering ingredients
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate items in same recipe
  CONSTRAINT recipe_ingredients_recipe_item_unique UNIQUE (recipe_id, item_id)
);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX recipes_workspace_id_idx ON recipes(workspace_id);
CREATE INDEX recipe_ingredients_recipe_id_idx ON recipe_ingredients(recipe_id);
CREATE INDEX recipe_ingredients_item_id_idx ON recipe_ingredients(item_id);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes

-- Policy: Users can view recipes in workspaces they're members of
CREATE POLICY "Users can view recipes in their workspaces"
  ON recipes
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create recipes in workspaces they're members of
CREATE POLICY "Users can create recipes in their workspaces"
  ON recipes
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update recipes in workspaces they're members of
CREATE POLICY "Users can update recipes in their workspaces"
  ON recipes
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Workspace owners can delete recipes
CREATE POLICY "Workspace owners can delete recipes"
  ON recipes
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for recipe_ingredients

-- Policy: Users can view ingredients in recipes from their workspaces
CREATE POLICY "Users can view ingredients in their workspace recipes"
  ON recipe_ingredients
  FOR SELECT
  USING (
    recipe_id IN (
      SELECT id
      FROM recipes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create ingredients in recipes from their workspaces
CREATE POLICY "Users can create ingredients in their workspace recipes"
  ON recipe_ingredients
  FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id
      FROM recipes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update ingredients in recipes from their workspaces
CREATE POLICY "Users can update ingredients in their workspace recipes"
  ON recipe_ingredients
  FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id
      FROM recipes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete ingredients in recipes from their workspaces
CREATE POLICY "Users can delete ingredients in their workspace recipes"
  ON recipe_ingredients
  FOR DELETE
  USING (
    recipe_id IN (
      SELECT id
      FROM recipes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
