import { vi } from 'vitest'

export type MockSupabaseClient = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
    signInWithOtp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
    exchangeCodeForSession: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
}

export function createMockSupabaseClient(
  overrides: Partial<MockSupabaseClient> = {}
): MockSupabaseClient {
  const defaultFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  }))

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithOtp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      exchangeCodeForSession: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      ...overrides.auth,
    },
    from: overrides.from ?? defaultFrom,
    rpc: overrides.rpc ?? vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
}

export function mockSupabaseModule(client: MockSupabaseClient) {
  vi.mock('@/lib/supabase/client', () => ({
    createClient: () => client,
  }))
}

// Helper to create a mock user
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Helper to create a mock workspace
export function createMockWorkspace(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-workspace-id',
    name: 'Test Workspace',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Helper to create a mock shopping list
export function createMockShoppingList(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-list-id',
    name: 'Test Shopping List',
    workspace_id: 'test-workspace-id',
    created_by: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Helper to create a mock list entry
export function createMockListEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-entry-id',
    list_id: 'test-list-id',
    item_id: 'test-item-id',
    note: null,
    checked: false,
    position: 0,
    items: {
      id: 'test-item-id',
      name: 'Test Item',
      icon_key: null,
    },
    ...overrides,
  }
}

// Helper to create a mock recipe
export function createMockRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-recipe-id',
    title: 'Test Recipe',
    instructions: 'Test instructions',
    image_url: null,
    external_link: null,
    workspace_id: 'test-workspace-id',
    created_by: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
