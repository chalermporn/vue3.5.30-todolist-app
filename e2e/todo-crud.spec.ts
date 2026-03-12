import { test, expect, type Page } from '@playwright/test'

async function addTodo(page: Page, text: string, priority: 'Low' | 'Med' | 'High' = 'Med') {
  if (priority !== 'Med') {
    await page.getByLabel(`Set priority to ${priority}`).click()
  }
  await page.getByLabel('New todo text').fill(text)
  await page.getByRole('button', { name: 'Add todo' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/todos')
})

// ── Empty state ──────────────────────────────────────────────────────────────

test.describe('Empty state', () => {
  test('shows empty state on fresh load', async ({ page }) => {
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByText('Nothing here yet')).toBeVisible()
    await expect(page.getByText('Add a todo above to get started')).toBeVisible()
  })

  test('shows "0 active · 0 done" stats initially', async ({ page }) => {
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 active')
    await expect(stats).toContainText('0 done')
  })

  test('Add button is disabled when input is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeDisabled()
  })
})

// ── Add todo ─────────────────────────────────────────────────────────────────

test.describe('Add todo', () => {
  test('can add a todo by pressing Enter', async ({ page }) => {
    await page.getByLabel('New todo text').fill('Enter key todo')
    await page.getByLabel('New todo text').press('Enter')
    await expect(page.locator('[aria-label="Todo: Enter key todo"]')).toBeVisible()
  })

  test('can add a todo by clicking Add button', async ({ page }) => {
    await page.getByLabel('New todo text').fill('Button click todo')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('[aria-label="Todo: Button click todo"]')).toBeVisible()
  })

  test('empty state disappears after first todo', async ({ page }) => {
    await addTodo(page, 'First ever todo')
    await expect(page.getByRole('status')).not.toBeVisible()
  })

  test('stats update after adding a todo', async ({ page }) => {
    await addTodo(page, 'Stats test todo')
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('1 active')
    await expect(stats).toContainText('0 done')
    await expect(stats).toContainText('1 total')
  })

  test('clears input after adding', async ({ page }) => {
    await addTodo(page, 'Temp todo')
    await expect(page.getByLabel('New todo text')).toHaveValue('')
  })

  test('resets priority to Med after adding', async ({ page }) => {
    await page.getByLabel('Set priority to High').click()
    await addTodo(page, 'High temp')
    await expect(page.getByLabel('Set priority to Med')).toHaveAttribute('aria-pressed', 'true')
  })

  test('can add todo with Low priority', async ({ page }) => {
    await page.getByLabel('Set priority to Low').click()
    await expect(page.getByLabel('Set priority to Low')).toHaveAttribute('aria-pressed', 'true')
    await addTodo(page, 'Low priority todo', 'Low')
    await expect(page.locator('[aria-label="Todo: Low priority todo"]')).toBeVisible()
  })

  test('can add todo with High priority', async ({ page }) => {
    await page.getByLabel('Set priority to High').click()
    await expect(page.getByLabel('Set priority to High')).toHaveAttribute('aria-pressed', 'true')
    await addTodo(page, 'High priority todo', 'High')
    await expect(page.locator('[aria-label="Todo: High priority todo"]')).toBeVisible()
  })

  test('adding multiple todos shows all in list', async ({ page }) => {
    await addTodo(page, 'First todo')
    await addTodo(page, 'Second todo')
    await addTodo(page, 'Third todo')
    const items = page.getByRole('list', { name: 'Todos' }).getByRole('listitem')
    await expect(items).toHaveCount(3)
    await expect(page.locator('header').locator('p')).toContainText('3 active')
  })

  test('whitespace-only input does not add todo', async ({ page }) => {
    await page.getByLabel('New todo text').fill('   ')
    // Add button should remain disabled (text.trim() is empty)
    await expect(page.getByRole('button', { name: 'Add todo' })).toBeDisabled()
  })
})

// ── Toggle completion ─────────────────────────────────────────────────────────

test.describe('Toggle completion', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Toggle me')
  })

  test('can mark a todo as completed', async ({ page }) => {
    await page.getByLabel('Mark as completed').click()
    await expect(page.getByLabel('Mark as active')).toBeVisible()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 active')
    await expect(stats).toContainText('1 done')
  })

  test('can unmark a completed todo', async ({ page }) => {
    await page.getByLabel('Mark as completed').click()
    await page.getByLabel('Mark as active').click()
    await expect(page.getByLabel('Mark as completed')).toBeVisible()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('1 active')
    await expect(stats).toContainText('0 done')
  })

  test('completed todo has line-through style', async ({ page }) => {
    await page.getByLabel('Mark as completed').click()
    const strikeText = page.locator('[aria-label="Todo: Toggle me"] span.line-through')
    await expect(strikeText).toBeVisible()
  })
})

// ── Delete todo ───────────────────────────────────────────────────────────────

test.describe('Delete todo', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Delete me')
  })

  test('can delete a todo by hovering and clicking delete', async ({ page }) => {
    const item = page.locator('[aria-label="Todo: Delete me"]')
    await item.hover()
    await item.getByLabel('Delete todo').click()
    await expect(page.locator('[aria-label="Todo: Delete me"]')).not.toBeVisible()
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('stats update after deleting', async ({ page }) => {
    const item = page.locator('[aria-label="Todo: Delete me"]')
    await item.hover()
    await item.getByLabel('Delete todo').click()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 active')
    await expect(stats).toContainText('0 done')
  })
})

// ── Edit todo ─────────────────────────────────────────────────────────────────

test.describe('Edit todo', () => {
  test.beforeEach(async ({ page }) => {
    await addTodo(page, 'Edit me')
  })

  test('can enter edit mode by double-clicking todo text', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    await expect(page.getByLabel('Edit todo text')).toBeVisible()
    await expect(page.getByLabel('Edit priority')).toBeVisible()
  })

  test('can enter edit mode via edit button', async ({ page }) => {
    const item = page.locator('[aria-label="Todo: Edit me"]')
    await item.hover()
    await item.getByLabel('Edit todo').click()
    await expect(page.getByLabel('Edit todo text')).toBeVisible()
  })

  test('can save edit by pressing Enter', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    const editInput = page.getByLabel('Edit todo text')
    await editInput.clear()
    await editInput.fill('Edited via Enter')
    await editInput.press('Enter')
    await expect(page.locator('[aria-label="Todo: Edited via Enter"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Edit me"]')).not.toBeVisible()
  })

  test('can save edit by clicking Save button', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    const editInput = page.getByLabel('Edit todo text')
    await editInput.clear()
    await editInput.fill('Saved via button')
    await page.getByLabel('Save edit').click()
    await expect(page.locator('[aria-label="Todo: Saved via button"]')).toBeVisible()
  })

  test('can cancel edit by pressing Escape', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    const editInput = page.getByLabel('Edit todo text')
    await editInput.clear()
    await editInput.fill('Should not save')
    await editInput.press('Escape')
    await expect(page.locator('[aria-label="Todo: Edit me"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Should not save"]')).not.toBeVisible()
  })

  test('can cancel edit by clicking Cancel button', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    await page.getByLabel('Cancel edit').click()
    await expect(page.locator('[aria-label="Todo: Edit me"]')).toBeVisible()
    await expect(page.getByLabel('Edit todo text')).not.toBeVisible()
  })

  test('can change priority while editing', async ({ page }) => {
    const todoSpan = page.locator('[aria-label="Todo: Edit me"] span.cursor-pointer')
    await todoSpan.dblclick()
    await page.getByLabel('Edit priority').selectOption('high')
    await page.getByLabel('Save edit').click()
    await expect(page.locator('[aria-label="Todo: Edit me"]')).toBeVisible()
    // Priority dot should now indicate high priority
    await expect(
      page.locator('[aria-label="Todo: Edit me"] [aria-label="Priority: high"]'),
    ).toBeVisible()
  })
})

// ── Dark mode ─────────────────────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test('toggles dark class on html element', async ({ page }) => {
    // Ensure clean slate
    await page.evaluate(() => document.documentElement.classList.remove('dark'))

    await page.getByLabel('Toggle dark mode').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByLabel('Toggle dark mode').click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})

// ── Stress test ───────────────────────────────────────────────────────────────

test.describe('Stress test', () => {
  test('+10k items loads and stats update correctly', async ({ page }) => {
    await page.getByRole('button', { name: '+10k items' }).click()
    // 10k items: every 4th is completed → 2500 completed, 7500 active
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('7500 active', { timeout: 10_000 })
    await expect(stats).toContainText('2500 done')
    await expect(stats).toContainText('10000 total')
  })

  test('virtual scrolling keeps DOM node count small with 10k items', async ({ page }) => {
    await page.getByRole('button', { name: '+10k items' }).click()

    // Wait for items to load
    await expect(page.locator('header').locator('p')).toContainText('7500 active', {
      timeout: 10_000,
    })

    // Virtual scroll: only a small slice is rendered in the DOM
    const renderedItems = page.locator('ul[aria-label="Todos"] li')
    const count = await renderedItems.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(100)
  })
})
