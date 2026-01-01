'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface RecipeIngredient {
  id: string
  note: string | null
  item: {
    id: string
    name: string
    icon_key: string | null
  }
}

interface AddRecipeToListProps {
  workspaceId: string
  recipeTitle: string
  ingredients: RecipeIngredient[]
}

export function AddRecipeToList({
  workspaceId,
  recipeTitle,
  ingredients,
}: AddRecipeToListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [listOption, setListOption] = useState<'existing' | 'new'>('existing')
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [newListName, setNewListName] = useState('')
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadLists = async () => {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setLists(data)
      if (data.length > 0) {
        setSelectedListId(data[0].id)
      }
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadLists()
    }
  }

  const handleAddToList = async () => {
    if (ingredients.length === 0) {
      toast.error('No ingredients to add')
      return
    }

    if (listOption === 'existing' && !selectedListId) {
      toast.error('Please select a list')
      return
    }

    if (listOption === 'new' && !newListName.trim()) {
      toast.error('Please enter a list name')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      let targetListId = selectedListId

      // Create new list if needed
      if (listOption === 'new') {
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            workspace_id: workspaceId,
            name: newListName.trim(),
            created_by: user.id,
          })
          .select()
          .single()

        if (createError) throw createError
        targetListId = newList.id
      }

      // Get existing entries for this list to determine position
      const { data: existingEntries } = await supabase
        .from('shopping_list_entries')
        .select('position')
        .eq('list_id', targetListId)
        .order('position', { ascending: false })
        .limit(1)

      const startPosition = existingEntries?.[0]?.position ?? -1

      // Add all ingredients to the list
      const entries = ingredients.map((ingredient, index) => ({
        list_id: targetListId,
        item_id: ingredient.item.id,
        note: ingredient.note,
        checked: false,
        position: startPosition + index + 1,
      }))

      const { error: insertError } = await supabase
        .from('shopping_list_entries')
        .upsert(entries, {
          onConflict: 'list_id,item_id',
          ignoreDuplicates: false,
        })

      if (insertError) throw insertError

      toast.success(`Added ${ingredients.length} ingredients to list`)
      setIsOpen(false)
      router.push(`/w/${workspaceId}/lists/${targetListId}`)
    } catch (error) {
      console.error('Error adding to list:', error)
      toast.error('Failed to add ingredients to list')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Ingredients to Shopping List</DialogTitle>
          <DialogDescription>
            Add all {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} from{' '}
            &quot;{recipeTitle}&quot; to a shopping list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={listOption}
            onValueChange={(value) => setListOption(value as 'existing' | 'new')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing">Add to existing list</Label>
            </div>
            {listOption === 'existing' && lists.length > 0 && (
              <div className="ml-6 mt-2">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {listOption === 'existing' && lists.length === 0 && (
              <p className="ml-6 text-sm text-muted-foreground">
                No lists available. Create a new one instead.
              </p>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">Create new list</Label>
            </div>
            {listOption === 'new' && (
              <div className="ml-6 mt-2">
                <Input
                  type="text"
                  placeholder="Enter list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleAddToList} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Ingredients'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
