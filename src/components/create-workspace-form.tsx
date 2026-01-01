'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export function CreateWorkspaceForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a workspace name')
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Create workspace using RPC function
      const { data: workspace, error } = await supabase
        .rpc('create_workspace_with_member', {
          p_name: name.trim(),
        })
        .single<{ id: string; name: string }>()

      if (error) {
        console.error('Error creating workspace:', error)
        toast.error('Failed to create workspace')
        return
      }

      if (!workspace) {
        toast.error('Failed to create workspace')
        return
      }

      toast.success('Workspace created!')
      router.push(`/w/${workspace.id}/lists`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Your First Workspace</CardTitle>
        <CardDescription>
          Workspaces help you organize your shopping lists and recipes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              type="text"
              placeholder="e.g., Home, Family, Work"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
