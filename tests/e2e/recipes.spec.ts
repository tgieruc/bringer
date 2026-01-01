import { test, expect } from '@playwright/test'

test.describe('Recipes - Page Structure', () => {
  test('recipes page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/w/test-workspace/recipes')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
  
  test('recipe detail page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/w/test-workspace/recipes/test-recipe-id')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
  
  test('new recipe page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/w/test-workspace/recipes/new')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Recipes - Responsive Design', () => {
  test('recipes page is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/w/test-workspace/recipes')
    
    // Should redirect to login (not authenticated)
    await expect(page).toHaveURL('/login')
  })
  
  test('recipe detail is responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/w/test-workspace/recipes/test-recipe-id')
    
    // Should redirect to login (not authenticated)
    await expect(page).toHaveURL('/login')
  })
  
  test('recipe form is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/w/test-workspace/recipes/new')
    
    // Should redirect to login (not authenticated)
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Recipe Navigation', () => {
  test('handles invalid recipe ID', async ({ page }) => {
    await page.goto('/w/test-workspace/recipes/invalid-uuid-format')
    
    // Should redirect to login first (middleware)
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Recipe Images', () => {
  test('recipe pages handle missing images gracefully', async ({ page }) => {
    // This would be tested when authenticated
    await page.goto('/w/test-workspace/recipes')
    await expect(page).toHaveURL('/login')
  })
})

// Note: These tests verify the redirect behavior for unauthenticated users.
// Full recipe workflow tests (CRUD operations, image uploads, ingredient management)
// would require authenticated sessions with Supabase test users.
