import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('shows "Vue Todo" heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vue Todo')
  })

  test('shows correct document title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Home · Vue Todo')
  })

  test('shows all feature highlights', async ({ page }) => {
    await page.goto('/')
    const features = [
      'Virtual scroll (100k+ items)',
      'Dark / light mode',
      'Priority levels',
      'Persisted to localStorage',
      'WCAG accessible',
      'Inline edit + search',
    ]
    for (const feature of features) {
      await expect(page.getByText(feature)).toBeVisible()
    }
  })

  test('navigates to /todos via "Open Todos" link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Open Todos/ }).click()
    await expect(page).toHaveURL('/todos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My Todos')
  })

  test('redirects unknown routes to home', async ({ page }) => {
    await page.goto('/not-a-real-page')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vue Todo')
  })

  test('/todos page shows correct heading and document title', async ({ page }) => {
    await page.goto('/todos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My Todos')
    await expect(page).toHaveTitle('My Todos · Vue Todo')
  })
})
