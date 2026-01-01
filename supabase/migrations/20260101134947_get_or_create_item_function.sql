-- Function to get or create an item with automatic icon assignment
-- This function is the primary way to create items in the system

CREATE OR REPLACE FUNCTION get_or_create_item(
  p_workspace_id UUID,
  p_name TEXT
)
RETURNS TABLE(
  item_id UUID,
  item_name TEXT,
  item_normalized_name TEXT,
  item_icon_key TEXT,
  was_created BOOLEAN
) AS $$
DECLARE
  v_normalized_name TEXT;
  v_existing_item items%ROWTYPE;
  v_best_icon_key TEXT;
  v_new_item items%ROWTYPE;
BEGIN
  -- Normalize the input name
  v_normalized_name := normalize_item_name(p_name);

  -- Check if item already exists
  SELECT * INTO v_existing_item
  FROM items
  WHERE workspace_id = p_workspace_id
    AND normalized_name = v_normalized_name;

  -- If item exists, return it
  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing_item.id,
      v_existing_item.name,
      v_existing_item.normalized_name,
      v_existing_item.icon_key,
      FALSE; -- was_created = false
    RETURN;
  END IF;

  -- Item doesn't exist, find best matching icon
  -- Use pg_trgm similarity to match item name with icon descriptions
  SELECT icon_key INTO v_best_icon_key
  FROM icons
  ORDER BY SIMILARITY(description, v_normalized_name) DESC
  LIMIT 1;

  -- Only use the icon if similarity is above threshold (0.15)
  IF (SELECT SIMILARITY(description, v_normalized_name) FROM icons WHERE icon_key = v_best_icon_key) < 0.15 THEN
    v_best_icon_key := NULL;
  END IF;

  -- Create new item with matched icon
  INSERT INTO items (workspace_id, name, icon_key)
  VALUES (p_workspace_id, p_name, v_best_icon_key)
  RETURNING * INTO v_new_item;

  -- Return the newly created item
  RETURN QUERY
  SELECT
    v_new_item.id,
    v_new_item.name,
    v_new_item.normalized_name,
    v_new_item.icon_key,
    TRUE; -- was_created = true
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_item(UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_or_create_item IS
  'Get existing item or create new item with automatic icon assignment. Returns item details and whether it was newly created.';
