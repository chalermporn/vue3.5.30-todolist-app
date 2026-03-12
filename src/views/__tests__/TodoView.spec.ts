import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todo'
import TodoView from '../TodoView.vue'

function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    wrapper: mount(TodoView, { global: { plugins: [pinia] } }),
    store: useTodoStore(),
  }
}

describe('TodoView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    // Reset dark class
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders the "My Todos" heading', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('h1').text()).toBe('My Todos')
    wrapper.unmount()
  })

  it('renders the search input', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('input[aria-label="Search todos"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders TodoInput, TodoFilters and TodoList components', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('form[aria-label="Add a new todo"]').exists()).toBe(true)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows 0 active and 0 done in stats text initially', () => {
    const { wrapper } = mountView()
    expect(wrapper.text()).toContain('0 active')
    expect(wrapper.text()).toContain('0 done')
    wrapper.unmount()
  })

  it('updates stats text when todos are added', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('Task 1')
    store.addTodo('Task 2')
    await Promise.resolve()
    expect(wrapper.text()).toContain('2 active')
    wrapper.unmount()
  })

  it('shows total count when store has items', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('Task 1')
    await Promise.resolve()
    expect(wrapper.text()).toContain('1 total')
    wrapper.unmount()
  })

  // ── toggleDark ─────────────────────────────────────────────────────────────

  it('toggleDark adds "dark" class to documentElement', async () => {
    const { wrapper } = mountView()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    await wrapper.find('button[aria-label="Toggle dark mode"]').trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    wrapper.unmount()
  })

  it('toggleDark removes "dark" class on second click', async () => {
    const { wrapper } = mountView()
    const darkBtn = wrapper.find('button[aria-label="Toggle dark mode"]')
    await darkBtn.trigger('click')
    await darkBtn.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    wrapper.unmount()
  })

  // ── stressTest ─────────────────────────────────────────────────────────────

  it('+10k button calls batchImport with 10,000 items', async () => {
    const { wrapper, store } = mountView()
    const spy = vi.spyOn(store, 'batchImport')
    const btn = wrapper.findAll('button').find((b) => b.text() === '+10k items')
    await btn?.trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toHaveLength(10_000)
    wrapper.unmount()
  })

  it('+100k button calls batchImport with 100,000 items', async () => {
    const { wrapper, store } = mountView()
    const spy = vi.spyOn(store, 'batchImport')
    const btn = wrapper.findAll('button').find((b) => b.text() === '+100k items')
    await btn?.trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toHaveLength(100_000)
    wrapper.unmount()
  })

  it('stress test items have correct priority cycling', async () => {
    const { wrapper, store } = mountView()
    const spy = vi.spyOn(store, 'batchImport')
    const btn = wrapper.findAll('button').find((b) => b.text() === '+10k items')
    await btn?.trigger('click')
    const items = spy.mock.calls[0]?.[0] ?? []
    expect(items[0]?.priority).toBe('low')
    expect(items[1]?.priority).toBe('medium')
    expect(items[2]?.priority).toBe('high')
    wrapper.unmount()
  })

  // ── search binding ─────────────────────────────────────────────────────────

  it('search input is bound to store.searchQuery', async () => {
    const { wrapper, store } = mountView()
    await wrapper.find('input[aria-label="Search todos"]').setValue('milk')
    expect(store.searchQuery).toBe('milk')
    wrapper.unmount()
  })

  // ── TodoList event forwarding through TodoView ────────────────────────────

  it('edit arrow function handler: triggers store.editTodo via TodoItem', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('editable todo')
    await nextTick()
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('edited text')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    await nextTick()
    expect(store.items[0]?.text).toBe('edited text')
    wrapper.unmount()
  })

  it('toggle event from TodoList calls store.toggleTodo (side effect)', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('toggleable')
    await nextTick()
    await wrapper.find('[role="checkbox"]').trigger('click')
    await nextTick()
    expect(store.items[0]?.completed).toBe(true)
    wrapper.unmount()
  })

  it('delete event from TodoList calls store.deleteTodo (side effect)', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('deletable')
    await nextTick()
    await wrapper.find('button[aria-label="Delete todo"]').trigger('click')
    await nextTick()
    expect(store.items).toHaveLength(0)
    wrapper.unmount()
  })

  it('clearCompleted event from TodoFilters calls store.clearCompleted (side effect)', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('active item')
    store.addTodo('done item')
    store.toggleTodo(store.items[0]!.id) // 'done item' → completed
    await nextTick()
    await wrapper.find('button[aria-label*="Clear"]').trigger('click')
    await nextTick()
    expect(store.items.every((t) => !t.completed)).toBe(true)
    wrapper.unmount()
  })

  it('toggleAll event from TodoFilters calls store.toggleAll (side effect)', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('item 1')
    store.addTodo('item 2')
    await nextTick()
    await wrapper.find('button[aria-label="Mark all completed"]').trigger('click')
    await nextTick()
    expect(store.items.every((t) => t.completed)).toBe(true)
    wrapper.unmount()
  })

  it('v-model on filter: clicking a filter tab updates store.filter', async () => {
    const { wrapper, store } = mountView()
    store.addTodo('item')
    await nextTick()
    // Click the "Active" tab — triggers update:modelValue which sets store.filter
    const activetab = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Active')
    await activetab?.trigger('click')
    await nextTick()
    expect(store.filter).toBe('active')
    wrapper.unmount()
  })
})
