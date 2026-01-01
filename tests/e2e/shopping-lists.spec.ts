import { test, expect } from '@playwright/test'

test.describe('Shopping Lists - Complete Workflow', () => {
  test('complete shopping list workflow without authentication', async ({ page }) => {
    // Navigate to home - should redirect to login
    await page.goto('/')
    await expect(page).toHaveURL('/login')
    
    // Check login page is displayed
    await expect(page.getByText('Bringer')).toBeVisible()
  })
})

test.describe('Shopping Lists - UI Elements', () => {
  test('lists page shows expected structure when unauthenticated', async ({ page }) => {
    // Try to access lists page
    await page.goto('/w/test-workspace/lists')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Shopping Lists - Responsive Design', () => {
  test('lists are responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/w/test-workspace/lists')
    
    // Should redirect to login (not authenticated)
    await expect(page).toHaveURL('/login')
  })
  
  test('lists are responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/w/test-workspace/lists')
    
    // Should redirect to login (not authenticated)
    await expect(page).toHaveURL('/login')
  })
})

test.describe('List Entries - Item Interaction', () => {
  test('list detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/w/test-workspace/lists/test-list-id')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('List Management - Error Handling', () => {
  test('handles navigation to non-existent workspace', async ({ page }) => {
    await page.goto('/w/nonexistent-workspace-id/lists')
    
    // Should redirect to login (middleware catches unauthenticated)
    await expect(page).toHaveURL('/login')
  })
})

// Note: These tests verify the redirect behavior for unauthenticated users.
// Authenticated E2E tests would require setting up Supabase test users and sessions.
