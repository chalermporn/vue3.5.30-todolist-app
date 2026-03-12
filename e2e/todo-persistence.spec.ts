import { test, expect, type Page } from '@playwright/test'

async function addTodo(page: Page, text: string) {
  await page.getByLabel('New todo text').fill(text)
  await page.getByRole('button', { name: 'Add todo' }).click()
}

/** Wait for the store to flush its debounced write to localStorage */
async function waitForPersisted(page: Page) {
  await page.waitForFunction(() => localStorage.getItem('vue-todo-v1') !== null, {
    timeout: 2000,
  })
}

// ── Persistence ───────────────────────────────────────────────────────────────

test.describe('localStorage persistence', () => {
  test('todos persist across page reload', async ({ page }) => {
    await page.goto('/todos')
    await addTodo(page, 'Persist this todo')
    await waitForPersisted(page)

    await page.reload()
    await expect(page.locator('[aria-label="Todo: Persist this todo"]')).toBeVisible()
  })

  test('completed state persists across reload', async ({ page }) => {
    await page.goto('/todos')
    await addTodo(page, 'Complete and persist')
    await page.getByLabel('Mark as completed').click()
    await waitForPersisted(page)

    await page.reload()
    // After reload the todo should still be completed
    await expect(page.getByLabel('Mark as active')).toBeVisible()
    const stats = page.locator('header').locator('p')
    await expect(stats).toContainText('0 active')
    await expect(stats).toContainText('1 done')
  })

  test('priority persists across reload', async ({ page }) => {
    await page.goto('/todos')
    await page.getByLabel('Set priority to High').click()
    await addTodo(page, 'High priority todo')
    await waitForPersisted(page)

    await page.reload()
    await expect(page.locator('[aria-label="Todo: High priority todo"]')).toBeVisible()
    await expect(
      page.locator('[aria-label="Todo: High priority todo"] [aria-label="Priority: high"]'),
    ).toBeVisible()
  })

  test('multiple todos all persist', async ({ page }) => {
    await page.goto('/todos')
    await addTodo(page, 'First persisted')
    await addTodo(page, 'Second persisted')
    await addTodo(page, 'Third persisted')
    await waitForPersisted(page)

    await page.reload()
    const items = page.getByRole('list', { name: 'Todos' }).getByRole('listitem')
    await expect(items).toHaveCount(3)
  })

  test('deleted todos do not reappear after reload', async ({ page }) => {
    await page.goto('/todos')
    await addTodo(page, 'Will be deleted')
    await addTodo(page, 'Will survive')

    const item = page.locator('[aria-label="Todo: Will be deleted"]')
    await item.hover()
    await item.getByLabel('Delete todo').click()
    await waitForPersisted(page)

    await page.reload()
    await expect(page.locator('[aria-label="Todo: Will be deleted"]')).not.toBeVisible()
    await expect(page.locator('[aria-label="Todo: Will survive"]')).toBeVisible()
  })

  test('edited todo text persists across reload', async ({ page }) => {
    await page.goto('/todos')
    await addTodo(page, 'Original text')

    const todoSpan = page.locator('[aria-label="Todo: Original text"] span.cursor-pointer')
    await todoSpan.dblclick()
    const editInput = page.getByLabel('Edit todo text')
    await editInput.clear()
    await editInput.fill('Edited text')
    await editInput.press('Enter')

    await waitForPersisted(page)
    await page.reload()
    await expect(page.locator('[aria-label="Todo: Edited text"]')).toBeVisible()
    await expect(page.locator('[aria-label="Todo: Original text"]')).not.toBeVisible()
  })
})

// ── Dark mode (not persisted) ─────────────────────────────────────────────────

test.describe('Dark mode persistence', () => {
  test('dark mode preference is NOT persisted across page reload', async ({ page }) => {
    await page.goto('/todos')
    await page.evaluate(() => document.documentElement.classList.remove('dark'))

    await page.getByLabel('Toggle dark mode').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})
