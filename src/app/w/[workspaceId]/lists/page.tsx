import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateListForm } from '@/components/create-list-form'

export default async function ListsPage({
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

  // Fetch all shopping lists for this workspace
  const { data: lists, error } = await supabase
    .from('shopping_lists')
    .select('id, name, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching lists:', error)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shopping Lists</h1>
      </div>

      {/* Create new list form */}
      <div className="mb-8">
        <CreateListForm workspaceId={workspaceId} />
      </div>

      {/* Display shopping lists */}
      {lists && lists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/w/${workspaceId}/lists/${list.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{list.name}</CardTitle>
                  <CardDescription>
                    Updated {new Date(list.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No shopping lists yet. Create your first list above!
        </p>
      )}
    </div>
  )
}
