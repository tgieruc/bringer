import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecipeActionsMenu } from '@/components/recipe-actions-menu'

export default async function RecipesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
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

  const isOwner = membership.role === 'owner'

  // Fetch all recipes for this workspace
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, instructions, image_url, external_link, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching recipes:', error)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Link href={`/w/${workspaceId}/recipes/new`}>
          <Button>Create Recipe</Button>
        </Link>
      </div>

      {/* Display recipes */}
      {recipes && recipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <Link href={`/w/${workspaceId}/recipes/${recipe.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  {recipe.image_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader className="pr-12">
                    <CardTitle>{recipe.title}</CardTitle>
                    <CardDescription>
                      {recipe.instructions.slice(0, 100)}
                      {recipe.instructions.length > 100 ? '...' : ''}
                    </CardDescription>
                  </CardHeader>
                  {recipe.external_link && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        External recipe available
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
              <div className="absolute top-3 right-3">
                <RecipeActionsMenu
                  recipeId={recipe.id}
                  recipeTitle={recipe.title}
                  workspaceId={workspaceId}
                  isOwner={isOwner}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No recipes yet. Create your first recipe!
          </p>
          <Link href={`/w/${workspaceId}/recipes/new`}>
            <Button>Create Recipe</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
