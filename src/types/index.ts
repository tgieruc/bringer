// Shared domain types for the Bringer application
// These types represent the core data structures used across components

export interface Item {
  id: string
  name: string
  icon_key: string | null
}

export interface Ingredient {
  id?: string
  note: string
  position: number
  item: Item
}

export interface Entry {
  id: string
  note: string
  checked: boolean
  position: number
  item: Item
}

export interface Recipe {
  id: string
  title: string
  instructions: string
  image_url: string | null
  external_link: string | null
  ingredients: Ingredient[]
}

export interface ShoppingList {
  id: string
  name: string
  workspace_id: string
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  created_at: string
}
