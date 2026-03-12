import { test, expect, type Page } from '@playwright/test'

async function addTodo(page: Page, text: string) {
  await page.getByLabel('New todo text').fill(text)
  await page.getByRole('button', { name: 'Add todo' }).click()
}

async function completeTodo(page: Page, text: string) {
  await page
    .locator(`[aria-label="Todo: ${text}"] [aria-label="Mark as completed"]`)
    .click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/todos')
})

// ── Search ────────────────────────────────────────────────────────────────────

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Walk the dog')
    await addTodo(page, 'Read a book')
  })

  test('filters todos by search text', async ({ page }) => {
    await page.getByLabel('Search todos').fill('groceries')
    await expect(page.locator('[aria-label="Todo: Buy groceries"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Walk the dog"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Read a book"]')).not.toBeVisible()
  })

  test('search is case-insensitive', async ({ page }) => {
    await page.getByLabel('Search todos').fill('GROCERIES')
    await expect(page.locator('[aria-label="Todo: Buy groceries"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Walk the dog"]')).not.toBeVisible()
  })

  test('shows all todos when search is cleared', async ({ page }) => {
    await page.getByLabel('Search todos').fill('groceries')
    await page.getByLabel('Search todos').clear()
    const items = page.getByRole('list', { name: 'Todos' }).getByRole('listitem')
    await expect(items).toHaveCount(3)
  })

  test('shows empty state when no results match', async ({ page }) => {
    await page.getByLabel('Search todos').fill('zzznomatch')
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByText('Nothing here yet')).toBeVisible()
  })

  test('partial text match works', async ({ page }) => {
    await page.getByLabel('Search todos').fill('ook')
    await expect(page.locator('[aria-label="Todo: Read a book"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Buy groceries"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Walk the dog"]')).not.toBeVisible()
  })
})

// ── Filter tabs ───────────────────────────────────────────────────────────────

test.describe('Filter tabs', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Active todo 1')
    await addTodo(page, 'Active todo 2')
    await addTodo(page, 'Completed todo')
    await completeTodo(page, 'Completed todo')
  })

  test('"All" tab shows all todos', async ({ page }) => {
    await page.getByRole('tab', { name: 'All' }).click()
    const items = page.getByRole('list', { name: 'Todos' }).getByRole('listitem')
    await expect(items).toHaveCount(3)
  })

  test('"Active" tab shows only incomplete todos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Active' }).click()
    await expect(page.locator('[aria-label="Todo: Active todo 1"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Active todo 2"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Completed todo"]')).not.toBeVisible()
  })

  test('"Completed" tab shows only completed todos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Completed' }).click()
    await expect(page.locator('[aria-label="Todo: Completed todo"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Active todo 1"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Active todo 2"]')).not.toBeVisible()
  })

  test('selected tab has aria-selected="true"', async ({ page }) => {
    await page.getByRole('tab', { name: 'Active' }).click()
    await expect(page.getByRole('tab', { name: 'Active' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByRole('tab', { name: 'Completed' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  test('switching back to "All" tab shows everything', async ({ page }) => {
    await page.getByRole('tab', { name: 'Active' }).click()
    await page.getByRole('tab', { name: 'All' }).click()
    const items = page.getByRole('list', { name: 'Todos' }).getByRole('listitem')
    await expect(items).toHaveCount(3)
  })
})

// ── Toggle all ────────────────────────────────────────────────────────────────

test.describe('Toggle all', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Todo 1')
    await addTodo(page, 'Todo 2')
    await addTodo(page, 'Todo 3')
  })

  test('"Check all" marks all todos as completed', async ({ page }) => {
    // aria-label is "Mark all completed" when active > 0
    await page.getByLabel('Mark all completed').click()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 active')
    await expect(stats).toContainText('3 done')
  })

  test('button text changes to "Uncheck all" after checking all', async ({ page }) => {
    await page.getByLabel('Mark all completed').click()
    await expect(page.getByText('Uncheck all', { exact: true })).toBeVisible()
    await expect(page.getByText('Check all', { exact: true })).not.toBeVisible()
  })

  test('"Uncheck all" marks all completed todos as active', async ({ page }) => {
    await page.getByLabel('Mark all completed').click()
    // aria-label is "Mark all active" when activeCount === 0
    await page.getByLabel('Mark all active').click()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('3 active')
    await expect(stats).toContainText('0 done')
  })

  test('button text changes back to "Check all" after unchecking all', async ({ page }) => {
    await page.getByLabel('Mark all completed').click()
    await page.getByLabel('Mark all active').click()
    await expect(page.getByText('Check all')).toBeVisible()
  })
})

// ── Clear completed ───────────────────────────────────────────────────────────

test.describe('Clear completed', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Keep me')
    await addTodo(page, 'Complete and clear')
    await completeTodo(page, 'Complete and clear')
  })

  test('"Clear N done" button is visible when completed todos exist', async ({ page }) => {
    await expect(page.getByLabel('Clear 1 completed todos')).toBeVisible()
  })

  test('"Clear N done" button shows completed count', async ({ page }) => {
    await expect(page.getByText('Clear 1 done')).toBeVisible()
  })

  test('"Clear N done" removes all completed todos', async ({ page }) => {
    await page.getByLabel('Clear 1 completed todos').click()
    await expect(page.locator('[aria-label="Todo: Complete and clear"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Keep me"]')).toBeVisible()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 done')
  })

  test('"Clear N done" button disappears after clearing', async ({ page }) => {
    await page.getByLabel('Clear 1 completed todos').click()
    await expect(page.getByLabel('Clear 1 completed todos')).not.toBeVisible()
  })

  test('"N items left" text shows when no completed todos exist', async ({ page }) => {
    await page.getByLabel('Clear 1 completed todos').click()
    await expect(page.getByText('1 item left')).toBeVisible()
  })

  test('"N items left" uses plural for count > 1', async ({ page }) => {
    await addTodo(page, 'Another active')
    await page.getByLabel('Clear 1 completed todos').click()
    await expect(page.getByText('2 items left')).toBeVisible()
  })
})

// ── Combined search + filter ──────────────────────────────────────────────────

test.describe('Combined search and filter', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Buy books')
    await addTodo(page, 'Buy milk') // will be completed
    await completeTodo(page, 'Buy milk')
  })

  test('search within Active filter only shows active matching todos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Active' }).click()
    await page.getByLabel('Search todos').fill('Buy')
    await expect(page.locator('[aria-label="Todo: Buy groceries"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Buy books"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Buy milk"]')).not.toBeVisible()
  })

  test('search within Completed filter only shows completed matching todos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Completed' }).click()
    await page.getByLabel('Search todos').fill('milk')
    await expect(page.locator('[aria-label="Todo: Buy milk"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Buy groceries"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Buy books"]')).not.toBeVisible()
  })

  test('no results when search matches but filter excludes', async ({ page }) => {
    await page.getByRole('tab', { name: 'Active' }).click()
    await page.getByLabel('Search todos').fill('milk') // milk is completed, not active
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByText('Nothing here yet')).toBeVisible()
  })
})
