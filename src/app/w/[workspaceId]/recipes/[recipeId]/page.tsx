import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { RecipeForm } from '@/components/recipe-form'

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string; recipeId: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { workspaceId, recipeId } = await params
  const { edit } = await searchParams
  const isEditMode = edit === 'true'
  const supabase = await createClient()

  // Verify user has access to this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .single()

  if (!membership) {
    redirect('/')
  }

  // Fetch the recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, title, instructions, image_url, external_link, workspace_id')
    .eq('id', recipeId)
    .eq('workspace_id', workspaceId)
    .single()

  if (recipeError || !recipe) {
    notFound()
  }

  // Fetch recipe ingredients with item details
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select(`
      id,
      note,
      position,
      item:items (
        id,
        name,
        icon_key
      )
    `)
    .eq('recipe_id', recipeId)
    .order('position', { ascending: true })

  if (ingredientsError) {
    console.error('Error fetching ingredients:', ingredientsError)
  }

  if (isEditMode) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link href={`/w/${workspaceId}/recipes/${recipeId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Cancel Edit
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-6">Edit Recipe</h1>
        <RecipeForm
          workspaceId={workspaceId}
          mode="edit"
          recipe={{
            ...recipe,
            ingredients: ingredients || [],
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/w/${workspaceId}/recipes`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Recipes
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <Link href={`/w/${workspaceId}/recipes/${recipeId}?edit=true`}>
            <Button>Edit Recipe</Button>
          </Link>
        </div>
      </div>

      {/* Recipe image */}
      {recipe.image_url && (
        <div className="mb-6 rounded-lg overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* External link */}
      {recipe.external_link && (
        <div className="mb-6">
          <a
            href={recipe.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            View original recipe
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          {ingredients && ingredients.length > 0 ? (
            <ul className="space-y-2">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <div className="font-medium">{ingredient.item.name}</div>
                    {ingredient.note && (
                      <div className="text-sm text-muted-foreground">
                        {ingredient.note}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No ingredients yet</p>
          )}
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {recipe.instructions || 'No instructions yet'}
          </div>
        </div>
      </div>
    </div>
  )
}
