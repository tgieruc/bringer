'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface Item {
  id: string
  name: string
  icon_key: string | null
}

interface Ingredient {
  id?: string
  note: string
  position: number
  item: Item
}

interface Recipe {
  id: string
  title: string
  instructions: string
  image_url: string | null
  external_link: string | null
  ingredients: Ingredient[]
}

interface RecipeFormProps {
  workspaceId: string
  mode: 'create' | 'edit'
  recipe?: Recipe
}

export function RecipeForm({ workspaceId, mode, recipe }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || '')
  const [instructions, setInstructions] = useState(recipe?.instructions || '')
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '')
  const [externalLink, setExternalLink] = useState(recipe?.external_link || '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe?.ingredients || [])
  const [newIngredientName, setNewIngredientName] = useState('')
  const [newIngredientNote, setNewIngredientNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newIngredientName.trim()) {
      toast.error('Please enter an ingredient name')
      return
    }

    setIsAdding(true)

    try {
      // Call get_or_create_item RPC function
      const { data: itemData, error: itemError } = await supabase
        .rpc('get_or_create_item', {
          p_workspace_id: workspaceId,
          p_name: newIngredientName.trim(),
        })
        .single()

      if (itemError) throw itemError

      // Check if ingredient already exists in the list
      if (ingredients.some(ing => ing.item.id === itemData.item_id)) {
        toast.error('This ingredient is already in the recipe')
        setIsAdding(false)
        return
      }

      // Add to local state
      const newIngredient: Ingredient = {
        note: newIngredientNote.trim(),
        position: ingredients.length,
        item: {
          id: itemData.item_id,
          name: itemData.item_name,
          icon_key: itemData.item_icon_key,
        },
      }

      setIngredients([...ingredients, newIngredient])
      setNewIngredientName('')
      setNewIngredientNote('')
      toast.success('Ingredient added!')
    } catch (error) {
      console.error('Error adding ingredient:', error)
      toast.error('Failed to add ingredient')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleUpdateIngredientNote = (index: number, note: string) => {
    setIngredients(ingredients.map((ing, i) =>
      i === index ? { ...ing, note } : ing
    ))
  }

  const handleSaveRecipe = async () => {
    if (!title.trim()) {
      toast.error('Please enter a recipe title')
      return
    }

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      let recipeId = recipe?.id

      if (mode === 'create') {
        // Create new recipe
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            workspace_id: workspaceId,
            title: title.trim(),
            instructions: instructions.trim(),
            image_url: imageUrl.trim() || null,
            external_link: externalLink.trim() || null,
            created_by: user.id,
          })
          .select()
          .single()

        if (recipeError) throw recipeError
        recipeId = newRecipe.id
      } else if (mode === 'edit' && recipeId) {
        // Update existing recipe
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            title: title.trim(),
            instructions: instructions.trim(),
            image_url: imageUrl.trim() || null,
            external_link: externalLink.trim() || null,
          })
          .eq('id', recipeId)

        if (updateError) throw updateError

        // Delete existing ingredients
        const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId)

        if (deleteError) throw deleteError
      }

      // Insert ingredients
      if (ingredients.length > 0 && recipeId) {
        const ingredientsToInsert = ingredients.map((ing, index) => ({
          recipe_id: recipeId,
          item_id: ing.item.id,
          note: ing.note,
          position: index,
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsToInsert)

        if (ingredientsError) throw ingredientsError
      }

      toast.success(mode === 'create' ? 'Recipe created!' : 'Recipe updated!')
      router.push(`/w/${workspaceId}/recipes/${recipeId}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast.error('Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }

  const getIcon = (iconKey: string | null) => {
    if (!iconKey) return null

    const iconName = iconKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')

    const Icon = LucideIcons[iconName as keyof typeof LucideIcons]
    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Grandma's Chocolate Cake"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <textarea
              id="instructions"
              placeholder="Enter step-by-step instructions..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background"
            />
          </div>

          <div>
            <Label htmlFor="image-url">Image URL (optional)</Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="external-link">External Link (optional)</Label>
            <Input
              id="external-link"
              type="url"
              placeholder="https://example.com/recipe"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ingredients</h2>

        {/* Add ingredient form */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleAddIngredient} className="flex gap-2">
              <Input
                type="text"
                placeholder="Ingredient name (e.g., Flour, Eggs...)"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="Amount (e.g., 2 cups, 3 eggs...)"
                value={newIngredientNote}
                onChange={(e) => setNewIngredientNote(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Button type="submit" disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ingredients list */}
        {ingredients.length > 0 ? (
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getIcon(ingredient.item.icon_key) && (
                      <div className="text-muted-foreground">
                        {getIcon(ingredient.item.icon_key)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.item.name}</div>
                      <Input
                        type="text"
                        value={ingredient.note}
                        onChange={(e) => handleUpdateIngredientNote(index, e.target.value)}
                        placeholder="Amount..."
                        className="mt-1 h-7 text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No ingredients yet. Add your first ingredient above!
          </p>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleSaveRecipe} disabled={isSaving}>
          {isSaving ? 'Saving...' : mode === 'create' ? 'Create Recipe' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
