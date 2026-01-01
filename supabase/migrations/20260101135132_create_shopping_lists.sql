-- Create shopping lists tables
-- Shopping lists contain ordered entries referencing items

-- Shopping lists table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shopping list entries table
CREATE TABLE shopping_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  note TEXT DEFAULT '', -- Free-form text for quantity, context, etc.
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL, -- For ordering entries
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate items in same list
  CONSTRAINT shopping_list_entries_list_item_unique UNIQUE (list_id, item_id)
);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER shopping_list_entries_updated_at
  BEFORE UPDATE ON shopping_list_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX shopping_lists_workspace_id_idx ON shopping_lists(workspace_id);
CREATE INDEX shopping_list_entries_list_id_idx ON shopping_list_entries(list_id);
CREATE INDEX shopping_list_entries_item_id_idx ON shopping_list_entries(item_id);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_lists

-- Policy: Users can view lists in workspaces they're members of
CREATE POLICY "Users can view lists in their workspaces"
  ON shopping_lists
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create lists in workspaces they're members of
CREATE POLICY "Users can create lists in their workspaces"
  ON shopping_lists
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update lists in workspaces they're members of
CREATE POLICY "Users can update lists in their workspaces"
  ON shopping_lists
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Workspace owners can delete lists
CREATE POLICY "Workspace owners can delete lists"
  ON shopping_lists
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for shopping_list_entries

-- Policy: Users can view entries in lists from their workspaces
CREATE POLICY "Users can view entries in their workspace lists"
  ON shopping_list_entries
  FOR SELECT
  USING (
    list_id IN (
      SELECT id
      FROM shopping_lists
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create entries in lists from their workspaces
CREATE POLICY "Users can create entries in their workspace lists"
  ON shopping_list_entries
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id
      FROM shopping_lists
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update entries in lists from their workspaces
CREATE POLICY "Users can update entries in their workspace lists"
  ON shopping_list_entries
  FOR UPDATE
  USING (
    list_id IN (
      SELECT id
      FROM shopping_lists
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete entries in lists from their workspaces
CREATE POLICY "Users can delete entries in their workspace lists"
  ON shopping_list_entries
  FOR DELETE
  USING (
    list_id IN (
      SELECT id
      FROM shopping_lists
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
