-- Create icons table for Lucide icon mappings
-- This is a global table (not workspace-specific)

CREATE TABLE icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_key TEXT NOT NULL UNIQUE, -- Lucide icon name (e.g., 'apple', 'milk', 'bread-slice')
  description TEXT NOT NULL, -- Human-readable description for matching
  keywords TEXT[], -- Additional keywords for better matching
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for text search
CREATE INDEX icons_description_idx ON icons USING gin(to_tsvector('english', description));
CREATE INDEX icons_keywords_idx ON icons USING gin(keywords);

-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Seed common food and household icons
INSERT INTO icons (icon_key, description, keywords) VALUES
  -- Fruits
  ('apple', 'apple fruit', ARRAY['fruit', 'red', 'green', 'apples']),
  ('cherry', 'cherry fruit', ARRAY['fruit', 'red', 'cherries', 'berry']),
  ('grape', 'grape fruit', ARRAY['fruit', 'purple', 'grapes', 'wine']),
  ('citrus', 'citrus orange lemon lime', ARRAY['fruit', 'orange', 'lemon', 'lime', 'citrus']),
  ('banana', 'banana fruit', ARRAY['fruit', 'yellow', 'bananas']),

  -- Vegetables
  ('carrot', 'carrot vegetable', ARRAY['vegetable', 'orange', 'carrots', 'veggie']),
  ('salad', 'salad lettuce greens', ARRAY['vegetable', 'lettuce', 'greens', 'leaves', 'veggie']),

  -- Dairy & Proteins
  ('milk', 'milk dairy', ARRAY['dairy', 'drink', 'beverage', 'cream']),
  ('egg', 'egg protein', ARRAY['protein', 'eggs', 'breakfast']),
  ('beef', 'beef meat', ARRAY['meat', 'protein', 'steak', 'ground beef']),
  ('drumstick', 'chicken poultry', ARRAY['meat', 'protein', 'poultry', 'chicken', 'turkey']),
  ('fish', 'fish seafood', ARRAY['protein', 'seafood', 'salmon', 'tuna']),

  -- Bakery & Grains
  ('wheat', 'wheat grain flour', ARRAY['grain', 'flour', 'bread', 'baking']),
  ('cake-slice', 'cake dessert', ARRAY['dessert', 'sweet', 'bakery', 'cake', 'pastry']),
  ('croissant', 'croissant bread pastry', ARRAY['bread', 'bakery', 'pastry', 'breakfast']),

  -- Beverages
  ('coffee', 'coffee drink', ARRAY['beverage', 'drink', 'cafe', 'espresso']),
  ('wine', 'wine alcohol', ARRAY['beverage', 'drink', 'alcohol', 'red wine', 'white wine']),
  ('beer', 'beer alcohol', ARRAY['beverage', 'drink', 'alcohol', 'lager']),
  ('cup-soda', 'soda soft drink', ARRAY['beverage', 'drink', 'cola', 'soda', 'pop']),

  -- Cooking & Kitchen
  ('chef-hat', 'cooking chef kitchen', ARRAY['cooking', 'chef', 'kitchen', 'recipe']),
  ('utensils', 'utensils fork knife', ARRAY['cooking', 'kitchen', 'cutlery', 'dining']),
  ('soup', 'soup bowl', ARRAY['food', 'meal', 'broth', 'stew']),
  ('pizza', 'pizza food', ARRAY['food', 'meal', 'italian', 'fast food']),
  ('sandwich', 'sandwich food', ARRAY['food', 'meal', 'lunch', 'bread']),
  ('cookie', 'cookie snack', ARRAY['snack', 'dessert', 'sweet', 'biscuit']),
  ('ice-cream-cone', 'ice cream dessert', ARRAY['dessert', 'sweet', 'frozen', 'ice cream']),

  -- Condiments & Spices
  ('flame', 'spicy hot pepper', ARRAY['spice', 'hot', 'pepper', 'chili', 'spicy']),
  ('droplet', 'water liquid oil', ARRAY['liquid', 'water', 'oil', 'sauce']),

  -- Household & Cleaning
  ('shopping-bag', 'shopping bag groceries', ARRAY['shopping', 'bag', 'groceries', 'store']),
  ('shopping-cart', 'shopping cart groceries', ARRAY['shopping', 'cart', 'groceries', 'store']),
  ('refrigerator', 'refrigerator fridge', ARRAY['appliance', 'fridge', 'cold', 'kitchen']),
  ('trash', 'trash garbage waste', ARRAY['cleaning', 'garbage', 'waste', 'disposal']),
  ('sparkles', 'cleaning shine sparkle', ARRAY['cleaning', 'clean', 'shine', 'sparkle']),

  -- Canned & Packaged
  ('can', 'can canned food', ARRAY['canned', 'packaged', 'tin', 'preserved']),
  ('package', 'package box container', ARRAY['packaged', 'box', 'container', 'delivery']),

  -- Herbs & Plants
  ('leaf', 'herb plant vegetable', ARRAY['herb', 'plant', 'green', 'leafy', 'basil', 'parsley']),
  ('flower', 'flower plant decoration', ARRAY['plant', 'decoration', 'garden', 'floral']),

  -- Generic & Misc
  ('circle', 'generic item', ARRAY['other', 'misc', 'generic', 'item']),
  ('square', 'box package', ARRAY['box', 'package', 'container']),
  ('heart', 'favorite love', ARRAY['favorite', 'love', 'like', 'heart']),
  ('star', 'important special', ARRAY['important', 'special', 'favorite', 'star']),
  ('tag', 'label price tag', ARRAY['label', 'price', 'tag', 'sale'])
ON CONFLICT (icon_key) DO NOTHING;
