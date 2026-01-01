# tests/ – Testing Infrastructure

This directory contains unit tests (Vitest) and E2E tests (Playwright).

---

## Directory Structure

| Path | Purpose |
|------|---------|
| `setup.ts` | Vitest setup with global mocks |
| `mocks/supabase.ts` | Supabase client mock factory |
| `components/` | Component unit tests |
| `e2e/` | Playwright end-to-end tests |

---

## Running Tests

```bash
# Unit tests (Vitest)
npm run test

# Unit tests in watch mode
npm run test -- --watch

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with UI
npm run test:e2e -- --ui
```

---

## Unit Testing (Vitest)

### Test File Pattern

Files: `tests/components/<component-name>.test.tsx`

### Mocking Supabase

Use the mock factory from `mocks/supabase.ts`:

```typescript
import { createMockSupabaseClient, mockSupabaseClient } from '../mocks/supabase'
import { vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))
```

### Mock Setup Pattern

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  
  // Configure mock responses
  mockSupabaseClient.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    })
  })
})
```

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('renders the form', () => {
  render(<MyComponent workspaceId="test-id" />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

---

## Global Mocks (setup.ts)

The setup file mocks:
- `next/navigation` (useRouter, useSearchParams, usePathname)
- `sonner` (toast notifications)
- `next-themes` (useTheme)

These are available in all tests automatically.

---

## E2E Testing (Playwright)

### Test File Pattern

Files: `tests/e2e/<feature>.spec.ts`

### Configuration

See `playwright.config.ts` in project root.

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Check your email')).toBeVisible()
})
```

### Local E2E Testing

E2E tests run against the local dev server. Ensure:
1. Local Supabase is running (`npx supabase start`)
2. Dev server is accessible (`npm run dev`)

---

## Adding New Tests

### Component Tests

1. Create `tests/components/<component>.test.tsx`
2. Mock Supabase client if component uses it
3. Use React Testing Library for rendering
4. Test user interactions and expected outcomes

### E2E Tests

1. Create `tests/e2e/<feature>.spec.ts`
2. Use Playwright's page object
3. Test complete user flows
4. Use realistic test data

---

## Cross-References

- See [../src/components/AGENTS.md](../src/components/AGENTS.md) for component structure
- See `mocks/supabase.ts` for mock implementation details
