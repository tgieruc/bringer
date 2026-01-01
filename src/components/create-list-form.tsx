'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface CreateListFormProps {
  workspaceId: string
}

export function CreateListForm({ workspaceId }: CreateListFormProps) {
  const [listName, setListName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listName.trim()) {
      toast.error('Please enter a list name')
      return
    }

    setIsLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Create the shopping list
      const { data: list, error } = await supabase
        .from('shopping_lists')
        .insert({
          workspace_id: workspaceId,
          name: listName.trim(),
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Shopping list created!')
      setListName('')
      router.refresh()

      // Navigate to the new list
      router.push(`/w/${workspaceId}/lists/${list.id}`)
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Failed to create shopping list')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New List</CardTitle>
        <CardDescription>
          Create a new shopping list for your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="list-name" className="sr-only">
              List name
            </Label>
            <Input
              id="list-name"
              type="text"
              placeholder="e.g., Weekly Groceries, Party Shopping..."
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create List'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
