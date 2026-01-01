-- Create items table for canonical item catalog
-- Items are unique per workspace by normalized name

-- Helper function to normalize item names
CREATE OR REPLACE FUNCTION normalize_item_name(item_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Lowercase, trim, and collapse multiple spaces to single space
  RETURN LOWER(TRIM(REGEXP_REPLACE(item_name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  icon_key TEXT, -- Lucide icon name (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique items per workspace by normalized name
  CONSTRAINT items_workspace_normalized_name_unique UNIQUE (workspace_id, normalized_name)
);

-- Trigger to auto-normalize name on insert/update
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := normalize_item_name(NEW.name);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_normalize_name
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION set_normalized_name();

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items in workspaces they're members of
CREATE POLICY "Users can view items in their workspaces"
  ON items
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create items in workspaces they're members of
CREATE POLICY "Users can create items in their workspaces"
  ON items
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update items in workspaces they're members of
CREATE POLICY "Users can update items in their workspaces"
  ON items
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only workspace owners can delete items
CREATE POLICY "Only workspace owners can delete items"
  ON items
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create index for faster lookups
CREATE INDEX items_workspace_id_idx ON items(workspace_id);
CREATE INDEX items_normalized_name_idx ON items(normalized_name);
