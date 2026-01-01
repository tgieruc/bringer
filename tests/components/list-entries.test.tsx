import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListEntries } from '@/components/list-entries'
import { toast } from 'sonner'

const mockToast = vi.mocked(toast)

// Mock Supabase client
const mockRpc = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react')
  return {
    ...actual,
    Trash2: () => <span data-testid="trash-icon">Trash</span>,
    Apple: () => <span data-testid="apple-icon">Apple</span>,
  }
})

describe('ListEntries', () => {
  const listId = 'test-list-id'
  const workspaceId = 'test-workspace-id'

  const mockEntries = [
    {
      id: 'entry-1',
      note: 'organic',
      checked: false,
      position: 0,
      item: {
        id: 'item-1',
        name: 'Apples',
        icon_key: 'apple',
      },
    },
    {
      id: 'entry-2',
      note: '',
      checked: true,
      position: 1,
      item: {
        id: 'item-2',
        name: 'Milk',
        icon_key: null,
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock RPC for get_or_create_item
    mockRpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { item_id: 'new-item-id' },
        error: null,
      }),
    })

    // Mock from().update()
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    // Mock from().delete()
    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    // Mock from().insert()
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'new-entry-id',
            note: '',
            checked: false,
            position: 2,
            item: {
              id: 'new-item-id',
              name: 'Bananas',
              icon_key: null,
            },
          },
          error: null,
        }),
      }),
    })

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_list_entries') {
        return {
          update: mockUpdate,
          delete: mockDelete,
          insert: mockInsert,
        }
      }
      return {}
    })
  })

  it('renders entries correctly', () => {
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    expect(screen.getByText('Apples')).toBeInTheDocument()
    expect(screen.getByText('organic')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })

  it('separates unchecked and checked items', () => {
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    // Checked items section should exist (named 'Completed' in the component)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows add item form', () => {
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    expect(screen.getByPlaceholderText(/Item name/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('shows error when adding empty item name', async () => {
    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter an item name')
    })
  })

  it('adds a new item successfully', async () => {
    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={[]}
      />
    )

    const nameInput = screen.getByPlaceholderText(/Item name/)
    await user.type(nameInput, 'Bananas')

    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('get_or_create_item', {
        p_workspace_id: workspaceId,
        p_name: 'Bananas',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Item added to list!')
    })
  })

  it('toggles item checked state', async () => {
    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    // Find checkbox for unchecked item (Apples)
    const checkboxes = screen.getAllByRole('checkbox')
    const applesCheckbox = checkboxes[0]
    await user.click(applesCheckbox)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_list_entries')
      expect(mockUpdate).toHaveBeenCalledWith({ checked: true })
    })
  })

  it('deletes an entry', async () => {
    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    // Find and click delete button
    const deleteButtons = screen.getAllByTestId('trash-icon')
    await user.click(deleteButtons[0].closest('button')!)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_list_entries')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('Item removed')
    })
  })

  it('shows error when toggle fails', async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
    })

    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update item')
    })
  })

  it('handles duplicate item error', async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Duplicate' },
        }),
      }),
    })

    const user = userEvent.setup()
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={mockEntries}
      />
    )

    const nameInput = screen.getByPlaceholderText(/Item name/)
    await user.type(nameInput, 'Apples')

    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('This item is already in the list')
    })
  })

  it('renders empty state correctly', () => {
    render(
      <ListEntries
        listId={listId}
        workspaceId={workspaceId}
        initialEntries={[]}
      />
    )

    // Should not show "Checked Items" heading when no items
    expect(screen.queryByText('Checked Items')).not.toBeInTheDocument()
  })
})
