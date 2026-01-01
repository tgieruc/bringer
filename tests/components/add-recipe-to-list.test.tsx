import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddRecipeToList } from '@/components/add-recipe-to-list'
import { toast } from 'sonner'
import { mockRouterPush } from '../setup'

const mockToast = vi.mocked(toast)

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}))

describe('AddRecipeToList', () => {
  const workspaceId = 'test-workspace-id'
  const recipeTitle = 'Chocolate Cake'
  const ingredients = [
    {
      id: 'ingredient-1',
      note: '2 cups',
      item: {
        id: 'item-1',
        name: 'Flour',
        icon_key: 'wheat',
      },
    },
    {
      id: 'ingredient-2',
      note: '1 cup',
      item: {
        id: 'item-2',
        name: 'Sugar',
        icon_key: 'sugar',
      },
    },
    {
      id: 'ingredient-3',
      note: null,
      item: {
        id: 'item-3',
        name: 'Eggs',
        icon_key: 'egg',
      },
    },
  ]

  const mockLists = [
    { id: 'list-1', name: 'Weekly Groceries' },
    { id: 'list-2', name: 'Party Shopping' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    })

    // Default mock for select (loading lists)
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_lists') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      if (table === 'shopping_list_entries') {
        return {
          select: mockSelect,
          upsert: mockUpsert,
        }
      }
      return {}
    })
  })

  it('renders trigger button', () => {
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    expect(screen.getByRole('button', { name: /Add to List/i })).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add Ingredients to Shopping List')).toBeInTheDocument()
      expect(screen.getByText(/Add all 3 ingredients from "Chocolate Cake"/)).toBeInTheDocument()
    })
  })

  it('loads existing lists when dialog opens', async () => {
    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('shopping_lists')
      expect(screen.getByText('Weekly Groceries')).toBeInTheDocument()
      expect(screen.getByText('Party Shopping')).toBeInTheDocument()
    })
  })

  it('adds ingredients to existing list', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    // Mock existing entries check
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ position: 5 }],
            error: null,
          }),
        }),
      }),
    })

    mockUpsert.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add to existing list')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          {
            list_id: 'list-1',
            item_id: 'item-1',
            note: '2 cups',
            checked: false,
            position: 6,
          },
          {
            list_id: 'list-1',
            item_id: 'item-2',
            note: '1 cup',
            checked: false,
            position: 7,
          },
          {
            list_id: 'list-1',
            item_id: 'item-3',
            note: null,
            checked: false,
            position: 8,
          },
        ],
        {
          onConflict: 'list_id,item_id',
          ignoreDuplicates: false,
        }
      )
      expect(mockToast.success).toHaveBeenCalledWith('Added 3 ingredients to list')
      expect(mockRouterPush).toHaveBeenCalledWith(`/w/${workspaceId}/lists/list-1`)
    })
  })

  it('creates new list and adds ingredients', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-list-id', name: 'New Recipe List' },
          error: null,
        }),
      }),
    })

    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    mockUpsert.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Create new list')).toBeInTheDocument()
    })

    const newListRadio = screen.getByLabelText('Create new list')
    await user.click(newListRadio)

    const nameInput = screen.getByPlaceholderText('Enter list name...')
    await user.type(nameInput, 'New Recipe List')

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        workspace_id: workspaceId,
        name: 'New Recipe List',
        created_by: 'test-user-id',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Added 3 ingredients to list')
      expect(mockRouterPush).toHaveBeenCalledWith(`/w/${workspaceId}/lists/new-list-id`)
    })
  })

  it('shows error when no list is selected', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('No lists available. Create a new one instead.')).toBeInTheDocument()
    })
  })

  it('shows error when new list name is empty', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Create new list')).toBeInTheDocument()
    })

    const newListRadio = screen.getByLabelText('Create new list')
    await user.click(newListRadio)

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please enter a list name')
    })
  })

  it('shows error when user is not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add to existing list')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in')
    })
  })

  it('shows error when database operation fails', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    mockUpsert.mockResolvedValue({ error: new Error('Database error') })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add to existing list')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to add ingredients to list')
    })
  })

  it('shows loading state during submission', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    mockUpsert.mockImplementation(() => new Promise(() => {}))

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add to existing list')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Adding.../i })).toBeInTheDocument()
    })
  })

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add Ingredients to Shopping List')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Add Ingredients to Shopping List')).not.toBeInTheDocument()
    })
  })

  it('handles empty ingredients list', () => {
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={[]}
      />
    )

    expect(screen.getByRole('button', { name: /Add to List/i })).toBeInTheDocument()
  })

  it('uses correct position for new entries when list is empty', async () => {
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      }),
    })

    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    mockUpsert.mockResolvedValue({ error: null })

    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={ingredients}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Add to existing list')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /Add Ingredients/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ position: 0 }),
          expect.objectContaining({ position: 1 }),
          expect.objectContaining({ position: 2 }),
        ]),
        expect.any(Object)
      )
    })
  })

  it('shows singular ingredient in description', async () => {
    const user = userEvent.setup()
    render(
      <AddRecipeToList
        workspaceId={workspaceId}
        recipeTitle={recipeTitle}
        ingredients={[ingredients[0]]}
      />
    )

    const button = screen.getByRole('button', { name: /Add to List/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Add all 1 ingredient from/)).toBeInTheDocument()
    })
  })
})
