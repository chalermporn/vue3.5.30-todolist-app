import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoFilters from '../todo/TodoFilters.vue'
import type { FilterMode } from '@/stores/todo'

interface Props {
  modelValue: FilterMode
  activeCount: number
  completedCount: number
  totalCount: number
}

function mountFilters(props: Props) {
  return mount(TodoFilters, { props })
}

describe('TodoFilters', () => {
  it('renders three filter tabs (All, Active, Completed)', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 2, completedCount: 0, totalCount: 2 })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
    expect(tabs.map((t) => t.text())).toEqual(['All', 'Active', 'Completed'])
  })

  it('marks the current filter tab as aria-selected="true"', () => {
    const wrapper = mountFilters({ modelValue: 'active', activeCount: 1, completedCount: 0, totalCount: 1 })
    const tabs = wrapper.findAll('[role="tab"]')
    const active = tabs.find((t) => t.text() === 'Active')
    expect(active?.attributes('aria-selected')).toBe('true')
    const all = tabs.find((t) => t.text() === 'All')
    expect(all?.attributes('aria-selected')).toBe('false')
  })

  it('emits update:modelValue when a filter tab is clicked', async () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 2, completedCount: 1, totalCount: 3 })
    const completedTab = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Completed')
    await completedTab?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['completed'])
  })

  it('shows "Check all" when there are active items', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 3, completedCount: 0, totalCount: 3 })
    expect(wrapper.text()).toContain('Check all')
  })

  it('shows "Uncheck all" when activeCount is 0', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 0, completedCount: 3, totalCount: 3 })
    expect(wrapper.text()).toContain('Uncheck all')
  })

  it('emits toggleAll when toggle-all button is clicked', async () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 2, completedCount: 0, totalCount: 2 })
    await wrapper.find('button[aria-label="Mark all completed"]').trigger('click')
    expect(wrapper.emitted('toggleAll')).toHaveLength(1)
  })

  it('shows "Clear N done" button when completedCount > 0', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 1, completedCount: 2, totalCount: 3 })
    expect(wrapper.find('button[aria-label="Clear 2 completed todos"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Clear 2 done')
  })

  it('emits clearCompleted when clear button is clicked', async () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 1, completedCount: 2, totalCount: 3 })
    await wrapper.find('button[aria-label="Clear 2 completed todos"]').trigger('click')
    expect(wrapper.emitted('clearCompleted')).toHaveLength(1)
  })

  it('shows "N items left" when completedCount is 0', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 3, completedCount: 0, totalCount: 3 })
    expect(wrapper.text()).toContain('3 items left')
  })

  it('uses singular "item" when activeCount is 1', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 1, completedCount: 0, totalCount: 1 })
    expect(wrapper.text()).toContain('1 item left')
    expect(wrapper.text()).not.toContain('1 items left')
  })

  it('hides clear button when completedCount is 0', () => {
    const wrapper = mountFilters({ modelValue: 'all', activeCount: 2, completedCount: 0, totalCount: 2 })
    expect(wrapper.find('button[aria-label*="Clear"]').exists()).toBe(false)
  })
})
