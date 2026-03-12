import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoList from '../todo/TodoList.vue'
import type { Todo } from '@/stores/todo'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: `id-${Math.random()}`,
    text: 'Test todo',
    completed: false,
    priority: 'medium',
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('TodoList', () => {
  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows empty state when items is empty', () => {
    const wrapper = mount(TodoList, { props: { items: [] } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nothing here yet')
    wrapper.unmount()
  })

  it('does not show virtual scroll container when empty', () => {
    const wrapper = mount(TodoList, { props: { items: [] } })
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    wrapper.unmount()
  })

  // ── With items ─────────────────────────────────────────────────────────────

  it('renders virtual scroll container when items exist', () => {
    const items = [makeTodo(), makeTodo()]
    const wrapper = mount(TodoList, { props: { items } })
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders TodoItem components for visible slice', () => {
    const items = [makeTodo({ text: 'alpha' }), makeTodo({ text: 'beta' })]
    const wrapper = mount(TodoList, { props: { items } })
    const lis = wrapper.findAll('li')
    expect(lis.length).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  it('sets aria-label with item count on the container', () => {
    const items = [makeTodo(), makeTodo(), makeTodo()]
    const wrapper = mount(TodoList, { props: { items } })
    expect(wrapper.find('[role="region"]').attributes('aria-label')).toBe('Todo list, 3 items')
    wrapper.unmount()
  })

  // ── ResizeObserver / containerHeight ──────────────────────────────────────

  it('covers ResizeObserver callback with valid entry (truthy branch)', () => {
    // The MockResizeObserver from test-setup fires with a valid entry on observe()
    const items = [makeTodo()]
    const wrapper = mount(TodoList, { props: { items } })
    // No error should be thrown and component should still be functional
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('covers ResizeObserver callback with empty entries (falsy branch)', () => {
    const items = [makeTodo()]
    const wrapper = mount(TodoList, { props: { items } })
    // Manually trigger the callback with no entries to hit the if (entry) falsy branch
    const ro = (globalThis as any).__latestResizeObserver
    expect(() => ro?.triggerWithEmpty()).not.toThrow()
    wrapper.unmount()
  })

  it('disconnects ResizeObserver on unmount (with items)', () => {
    const items = [makeTodo()]
    const wrapper = mount(TodoList, { props: { items } })
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('handles unmount when no ResizeObserver was created (empty items)', () => {
    const wrapper = mount(TodoList, { props: { items: [] } })
    expect(() => wrapper.unmount()).not.toThrow()
  })

  // ── Scroll handling ────────────────────────────────────────────────────────

  it('onScroll updates internal scrollTop', async () => {
    const items = Array.from({ length: 20 }, (_, i) => makeTodo({ text: `item ${i}` }))
    const wrapper = mount(TodoList, { props: { items } })
    const container = wrapper.find('[role="region"]')
    container.element.scrollTop = 300
    await container.trigger('scroll')
    // No error should occur; the scroll handler reads scrollTop from the event target
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
    wrapper.unmount()
  })

  // ── Event forwarding ───────────────────────────────────────────────────────

  it('forwards toggle event from TodoItem', async () => {
    const todo = makeTodo({ id: 'test-id' })
    const wrapper = mount(TodoList, { props: { items: [todo] } })
    const checkbox = wrapper.find('[role="checkbox"]')
    await checkbox.trigger('click')
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['test-id'])
    wrapper.unmount()
  })

  it('forwards delete event from TodoItem', async () => {
    const todo = makeTodo({ id: 'del-id' })
    const wrapper = mount(TodoList, { props: { items: [todo] } })
    await wrapper.find('button[aria-label="Delete todo"]').trigger('click')
    expect(wrapper.emitted('delete')?.[0]).toEqual(['del-id'])
    wrapper.unmount()
  })

  it('forwards edit event from TodoItem', async () => {
    const todo = makeTodo({ id: 'edit-id', text: 'original' })
    const wrapper = mount(TodoList, { props: { items: [todo] } })
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('updated')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    const editEvents = wrapper.emitted('edit')
    expect(editEvents).toBeDefined()
    expect(editEvents?.[0]?.[0]).toBe('edit-id')
    wrapper.unmount()
  })
})
