import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should be handled by middleware, but as a fallback
    return redirect('/login')
  }

  // TODO: Fetch workspaces for the user once schema is ready
  // Expected query pattern:
  // const { data: workspaces } = await supabase
  //   .from('workspace_members')
  //   .select('workspace_id, workspaces(id)')
  //   .eq('user_id', user.id)
  //   .order('created_at', { ascending: true })
  
  const workspaces: { id: string }[] = [] // Placeholder until schema exists

  if (workspaces && workspaces.length > 0) {
    redirect(`/w/${workspaces[0].id}/lists`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Bringer!</CardTitle>
          <CardDescription>
            You are not a member of any workspaces yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">TODO:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Implement workspace creation form</li>
              <li>Implement workspace invitation flow</li>
              <li>Add workspace switcher in app shell</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

