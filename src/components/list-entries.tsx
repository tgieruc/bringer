'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface Item {
  id: string
  name: string
  icon_key: string | null
}

interface Entry {
  id: string
  note: string
  checked: boolean
  position: number
  item: Item
}

interface ListEntriesProps {
  listId: string
  workspaceId: string
  initialEntries: Entry[]
}

export function ListEntries({ listId, workspaceId, initialEntries }: ListEntriesProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [newItemName, setNewItemName] = useState('')
  const [newItemNote, setNewItemNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newItemName.trim()) {
      toast.error('Please enter an item name')
      return
    }

    setIsAdding(true)

    try {
      // Call get_or_create_item RPC function
      const { data: itemData, error: itemError } = await supabase
        .rpc('get_or_create_item', {
          p_workspace_id: workspaceId,
          p_name: newItemName.trim(),
        })
        .single()

      if (itemError) throw itemError

      // Add entry to the list
      const maxPosition = entries.length > 0
        ? Math.max(...entries.map(e => e.position))
        : 0

      const { data: newEntry, error: entryError } = await supabase
        .from('shopping_list_entries')
        .insert({
          list_id: listId,
          item_id: itemData.item_id,
          note: newItemNote.trim(),
          position: maxPosition + 1,
          checked: false,
        })
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
        .single()

      if (entryError) {
        // Check if it's a duplicate item error
        if (entryError.code === '23505') {
          toast.error('This item is already in the list')
          return
        }
        throw entryError
      }

      // Add to local state
      setEntries([...entries, newEntry as Entry])
      setNewItemName('')
      setNewItemNote('')
      toast.success('Item added to list!')
      router.refresh()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleChecked = async (entryId: string, currentChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list_entries')
        .update({ checked: !currentChecked })
        .eq('id', entryId)

      if (error) throw error

      // Update local state
      setEntries(entries.map(e =>
        e.id === entryId ? { ...e, checked: !currentChecked } : e
      ))
    } catch (error) {
      console.error('Error toggling entry:', error)
      toast.error('Failed to update item')
    }
  }

  const handleUpdateNote = async (entryId: string, newNote: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_entries')
        .update({ note: newNote })
        .eq('id', entryId)

      if (error) throw error

      // Update local state
      setEntries(entries.map(e =>
        e.id === entryId ? { ...e, note: newNote } : e
      ))
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Failed to update note')
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      // Update local state
      setEntries(entries.filter(e => e.id !== entryId))
      toast.success('Item removed')
      router.refresh()
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to remove item')
    }
  }

  const getIcon = (iconKey: string | null) => {
    if (!iconKey) return null

    // Convert icon_key to PascalCase for Lucide
    const iconName = iconKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')

    const Icon = LucideIcons[iconName as keyof typeof LucideIcons]
    return Icon ? <Icon className="h-5 w-5" /> : null
  }

  const uncheckedEntries = entries.filter(e => !e.checked)
  const checkedEntries = entries.filter(e => e.checked)

  return (
    <div className="space-y-6">
      {/* Add new item form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Item name (e.g., Tomatoes, Milk...)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Input
                type="text"
                placeholder="Note (optional, e.g., 2kg, organic...)"
                value={newItemNote}
                onChange={(e) => setNewItemNote(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Button type="submit" disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Unchecked items */}
      {uncheckedEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Items to Buy</h2>
          {uncheckedEntries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onToggle={handleToggleChecked}
              onUpdateNote={handleUpdateNote}
              onDelete={handleDeleteEntry}
              getIcon={getIcon}
            />
          ))}
        </div>
      )}

      {/* Checked items */}
      {checkedEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">Completed</h2>
          {checkedEntries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onToggle={handleToggleChecked}
              onUpdateNote={handleUpdateNote}
              onDelete={handleDeleteEntry}
              getIcon={getIcon}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No items yet. Add your first item above!
        </p>
      )}
    </div>
  )
}

function EntryItem({
  entry,
  onToggle,
  onUpdateNote,
  onDelete,
  getIcon,
}: {
  entry: Entry
  onToggle: (id: string, checked: boolean) => void
  onUpdateNote: (id: string, note: string) => void
  onDelete: (id: string) => void
  getIcon: (iconKey: string | null) => React.ReactNode
}) {
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(entry.note)

  const handleNoteBlur = () => {
    setIsEditingNote(false)
    if (noteValue !== entry.note) {
      onUpdateNote(entry.id, noteValue)
    }
  }

  return (
    <Card className={entry.checked ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={entry.checked}
            onChange={() => onToggle(entry.id, entry.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />

          {/* Icon */}
          {getIcon(entry.item.icon_key) && (
            <div className="text-muted-foreground">
              {getIcon(entry.item.icon_key)}
            </div>
          )}

          {/* Item name */}
          <div className="flex-1">
            <div className={`font-medium ${entry.checked ? 'line-through' : ''}`}>
              {entry.item.name}
            </div>

            {/* Note */}
            {isEditingNote ? (
              <Input
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={handleNoteBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNoteBlur()
                  if (e.key === 'Escape') {
                    setNoteValue(entry.note)
                    setIsEditingNote(false)
                  }
                }}
                className="mt-1 h-7 text-sm"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingNote(true)}
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
              >
                {entry.note || 'Add note...'}
              </div>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(entry.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
