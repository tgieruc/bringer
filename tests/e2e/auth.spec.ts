import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Check page title and description
    await expect(page.getByText('Bringer')).toBeVisible()
    await expect(page.getByText('Sign in via magic link with your email below.')).toBeVisible()
    
    // Check form elements
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
  })

  test('email input accepts valid email', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByLabel('Email')
    await emailInput.fill('test@example.com')
    
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('form shows loading state on submit', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByLabel('Email')
    await emailInput.fill('test@example.com')
    
    const submitButton = page.getByRole('button', { name: 'Send Magic Link' })
    await submitButton.click()
    
    // Button should show loading state
    await expect(page.getByRole('button', { name: 'Sending...' })).toBeVisible()
    
    // Input should be disabled during loading
    await expect(emailInput).toBeDisabled()
  })

  test('form requires email field', async ({ page }) => {
    await page.goto('/login')
    
    // Email input should be required (HTML5 validation)
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toHaveAttribute('required', '')
  })
})

test.describe('Middleware Redirects', () => {
  test('unauthenticated user is redirected to login from protected route', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/w/some-workspace-id/lists')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated user is redirected from root to login', async ({ page }) => {
    await page.goto('/')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Responsive Design', () => {
  test('login page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Card should be visible and not overflow
    const card = page.locator('[data-slot="card"]').first()
    await expect(card).toBeVisible()
    
    // Form should still be usable
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
  })
})
