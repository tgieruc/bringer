import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecipeForm } from '@/components/recipe-form'

export default async function NewRecipePage({
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create New Recipe</h1>
      <RecipeForm workspaceId={workspaceId} mode="create" />
    </div>
  )
}
