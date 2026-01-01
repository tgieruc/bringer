import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateWorkspaceForm } from '@/components/create-workspace-form'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should be handled by middleware, but as a fallback
    return redirect('/login')
  }

  // Fetch workspaces for the user
  const { data: workspaces } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // If user has workspaces, redirect to first one
  if (workspaces && workspaces.length > 0) {
    const firstMembership = workspaces[0]
    const workspace = firstMembership.workspaces as { id: string } | { id: string }[] | null
    if (workspace && !Array.isArray(workspace) && workspace.id) {
      redirect(`/w/${workspace.id}/lists`)
    }
  }

  // Show workspace creation form if no workspaces
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <CreateWorkspaceForm />
    </div>
  )
}

