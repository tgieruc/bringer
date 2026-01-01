import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipeForm } from '@/components/recipe-form'
import { toast } from 'sonner'
import { mockRouterPush } from '../setup'

const mockToast = vi.mocked(toast)

// Mock Supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

describe('RecipeForm', () => {
  const workspaceId = 'test-workspace-id'

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    })

    // Setup RPC mock with proper chaining
    mockRpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          item_id: 'item-1',
          item_name: 'Flour',
          item_icon_key: 'wheat',
        },
        error: null,
      }),
    })
  })

  describe('Create Mode', () => {
    it('renders empty form in create mode', () => {
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      expect(screen.getByLabelText(/Recipe Title/i)).toHaveValue('')
      expect(screen.getByLabelText('Instructions')).toHaveValue('')
      expect(screen.getByLabelText('Image URL (optional)')).toHaveValue('')
      expect(screen.getByLabelText('External Link (optional)')).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Create Recipe' })).toBeInTheDocument()
    })

    it('allows filling in recipe details', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.type(screen.getByLabelText(/Recipe Title/i), 'Chocolate Cake')
      await user.type(screen.getByLabelText('Instructions'), 'Mix ingredients and bake')
      await user.type(screen.getByLabelText('Image URL (optional)'), 'https://example.com/cake.jpg')

      expect(screen.getByLabelText(/Recipe Title/i)).toHaveValue('Chocolate Cake')
      expect(screen.getByLabelText('Instructions')).toHaveValue('Mix ingredients and bake')
      expect(screen.getByLabelText('Image URL (optional)')).toHaveValue('https://example.com/cake.jpg')
    })

    it('adds ingredient to recipe', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      const ingredientInput = screen.getByPlaceholderText(/Ingredient name/i)
      await user.type(ingredientInput, 'Flour')

      const noteInput = screen.getByPlaceholderText(/Amount/i)
      await user.type(noteInput, '2 cups')

      const addButton = screen.getByRole('button', { name: 'Add' })
      await user.click(addButton)

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('get_or_create_item', {
          p_workspace_id: workspaceId,
          p_name: 'Flour',
        })
        expect(screen.getByText('Flour')).toBeInTheDocument()
      })
    })

    it('prevents adding duplicate ingredients', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      // Add first ingredient
      const ingredientInput = screen.getByPlaceholderText(/Ingredient name/i)
      await user.type(ingredientInput, 'Flour')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(screen.getByText('Flour')).toBeInTheDocument()
      })

      // Try to add same ingredient again
      await user.clear(ingredientInput)
      await user.type(ingredientInput, 'Flour')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('This ingredient is already in the recipe')
      })
    })

    it('removes ingredient from recipe', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      // Add ingredient
      await user.type(screen.getByPlaceholderText(/Ingredient name/i), 'Flour')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(screen.getByText('Flour')).toBeInTheDocument()
      })

      // Remove ingredient - find all buttons and click the one after Flour text appears
      const buttons = screen.getAllByRole('button')
      const trashButton = buttons.find(btn => btn.className.includes('text-destructive'))
      expect(trashButton).toBeDefined()
      if (trashButton) await user.click(trashButton)

      await waitFor(() => {
        expect(screen.queryByText('Flour')).not.toBeInTheDocument()
      })
    })

    it('creates recipe with ingredients', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-recipe-id', title: 'Chocolate Cake' },
            error: null,
          }),
        }),
      })

      mockFrom.mockImplementation((table) => {
        if (table === 'recipes') {
          return { insert: mockInsert, update: mockUpdate }
        }
        if (table === 'recipe_ingredients') {
          return { delete: mockDelete, insert: mockInsert }
        }
        return {}
      })

      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      // Fill in recipe details
      await user.type(screen.getByLabelText(/Recipe Title/i), 'Chocolate Cake')
      await user.type(screen.getByLabelText('Instructions'), 'Mix and bake')

      // Add ingredient
      await user.type(screen.getByPlaceholderText(/Ingredient name/i), 'Flour')
      await user.type(screen.getByPlaceholderText(/Amount/i), '2 cups')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(screen.getByText('Flour')).toBeInTheDocument()
      })

      // Save recipe
      await user.click(screen.getByRole('button', { name: 'Create Recipe' }))

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            workspace_id: workspaceId,
            title: 'Chocolate Cake',
            instructions: 'Mix and bake',
            created_by: 'test-user-id',
          })
        )
        expect(mockToast.success).toHaveBeenCalledWith('Recipe created!')
        expect(mockRouterPush).toHaveBeenCalledWith(`/w/${workspaceId}/recipes/new-recipe-id`)
      })
    })

    it('shows error when title is empty', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.click(screen.getByRole('button', { name: 'Create Recipe' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Please enter a recipe title')
      })
    })

    it('shows error when ingredient name is empty', async () => {
      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Please enter an ingredient name')
      })
    })
  })

  describe('Edit Mode', () => {
    const existingRecipe = {
      id: 'recipe-1',
      title: 'Existing Recipe',
      instructions: 'Old instructions',
      image_url: 'https://example.com/old.jpg',
      external_link: 'https://example.com',
      ingredients: [
        {
          id: 'ingredient-1',
          note: '1 cup',
          position: 0,
          item: {
            id: 'item-1',
            name: 'Sugar',
            icon_key: 'sugar',
          },
        },
      ],
    }

    it('renders form with existing recipe data', () => {
      render(
        <RecipeForm workspaceId={workspaceId} mode="edit" recipe={existingRecipe} />
      )

      expect(screen.getByLabelText(/Recipe Title/i)).toHaveValue('Existing Recipe')
      expect(screen.getByLabelText('Instructions')).toHaveValue('Old instructions')
      expect(screen.getByLabelText('Image URL (optional)')).toHaveValue('https://example.com/old.jpg')
      expect(screen.getByText('Sugar')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1 cup')).toBeInTheDocument()
    })

    it('updates recipe successfully', async () => {
      mockFrom.mockImplementation((table) => {
        if (table === 'recipes') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'recipe_ingredients') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            insert: mockInsert.mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      const user = userEvent.setup()
      render(
        <RecipeForm workspaceId={workspaceId} mode="edit" recipe={existingRecipe} />
      )

      const titleInput = screen.getByLabelText(/Recipe Title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Recipe')

      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Recipe updated!')
        expect(mockRouterPush).toHaveBeenCalledWith(`/w/${workspaceId}/recipes/recipe-1`)
      })
    })

    it('updates ingredient notes', async () => {
      const user = userEvent.setup()
      render(
        <RecipeForm workspaceId={workspaceId} mode="edit" recipe={existingRecipe} />
      )

      const inputs = screen.getAllByDisplayValue('1 cup')
      expect(inputs.length).toBeGreaterThan(0)
      const noteInput = inputs[0]
      
      await user.clear(noteInput)
      await user.type(noteInput, '2 cups')

      expect(noteInput).toHaveValue('2 cups')
    })
  })

  describe('Error Handling', () => {
    it('shows error when user is not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.type(screen.getByLabelText(/Recipe Title/i), 'Test Recipe')
      await user.click(screen.getByRole('button', { name: 'Create Recipe' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('You must be logged in')
      })
    })

    it('shows error when RPC fails', async () => {
      mockRpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('RPC failed'),
        }),
      })

      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.type(screen.getByPlaceholderText(/Ingredient name/i), 'Flour')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to add ingredient')
      })
    })

    it('shows loading state when adding ingredient', async () => {
      mockRpc.mockReturnValue({
        single: vi.fn().mockImplementation(() => new Promise(() => {})),
      })

      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.type(screen.getByPlaceholderText(/Ingredient name/i), 'Flour')
      await user.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Adding...' })).toBeInTheDocument()
      })
    })

    it('shows loading state when saving recipe', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => new Promise(() => {})),
        }),
      })

      mockFrom.mockReturnValue({ insert: mockInsert })

      const user = userEvent.setup()
      render(<RecipeForm workspaceId={workspaceId} mode="create" />)

      await user.type(screen.getByLabelText(/Recipe Title/i), 'Test Recipe')
      await user.click(screen.getByRole('button', { name: 'Create Recipe' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument()
      })
    })
  })
})
