import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { ListEntries } from '@/components/list-entries'
import { ListActionsMenu } from '@/components/list-actions-menu'

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; listId: string }>
}) {
  const { workspaceId, listId } = await params
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

  // Fetch the shopping list
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('id, name, workspace_id, created_at')
    .eq('id', listId)
    .eq('workspace_id', workspaceId)
    .single()

  if (listError || !list) {
    notFound()
  }

  // Fetch list entries with item details
  const { data: entries, error: entriesError } = await supabase
    .from('shopping_list_entries')
    .select(`
      id,
      note,
      checked,
      position,
      item:items (
        id,
        name,
        icon_key
      )
    `)
    .eq('list_id', listId)
    .order('position', { ascending: true })

  if (entriesError) {
    console.error('Error fetching entries:', entriesError)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/w/${workspaceId}/lists`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Lists
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{list.name}</h1>
          <ListActionsMenu
            listId={listId}
            listName={list.name}
            workspaceId={workspaceId}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* List entries component */}
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={entries || []}
      />
    </div>
  )
}
