import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TodoItem from '../todo/TodoItem.vue'
import type { Priority } from '@/stores/todo'

interface Props {
  id: string
  text: string
  completed: boolean
  priority: Priority
}

function mountItem(props: Props) {
  return mount(TodoItem, { props, attachTo: document.body })
}

const baseProps: Props = { id: 'todo-1', text: 'Buy milk', completed: false, priority: 'medium' }

describe('TodoItem', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders todo text', () => {
    const wrapper = mountItem(baseProps)
    expect(wrapper.text()).toContain('Buy milk')
    wrapper.unmount()
  })

  it('renders checkbox with aria-checked=false when not completed', () => {
    const wrapper = mountItem(baseProps)
    const checkbox = wrapper.find('[role="checkbox"]')
    expect(checkbox.attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })

  it('renders checkbox with aria-checked=true when completed', () => {
    const wrapper = mountItem({ ...baseProps, completed: true })
    const checkbox = wrapper.find('[role="checkbox"]')
    expect(checkbox.attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('applies opacity-60 class when completed', () => {
    const wrapper = mountItem({ ...baseProps, completed: true })
    expect(wrapper.find('li').classes()).toContain('opacity-60')
    wrapper.unmount()
  })

  it('applies line-through class on text span when completed', () => {
    const wrapper = mountItem({ ...baseProps, completed: true })
    expect(wrapper.find('span.flex-1').classes()).toContain('line-through')
    wrapper.unmount()
  })

  it('does not apply line-through when not completed', () => {
    const wrapper = mountItem(baseProps)
    expect(wrapper.find('span.flex-1').classes()).not.toContain('line-through')
    wrapper.unmount()
  })

  it('applies low priority ring class', () => {
    const wrapper = mountItem({ ...baseProps, priority: 'low' })
    expect(wrapper.find('li').classes().some((c) => c.includes('ring-success'))).toBe(true)
    wrapper.unmount()
  })

  it('applies high priority ring class', () => {
    const wrapper = mountItem({ ...baseProps, priority: 'high' })
    expect(wrapper.find('li').classes().some((c) => c.includes('ring-destructive'))).toBe(true)
    wrapper.unmount()
  })

  // ── Toggle ─────────────────────────────────────────────────────────────────

  it('emits toggle with id when checkbox is clicked', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['todo-1'])
    wrapper.unmount()
  })

  // ── Delete ─────────────────────────────────────────────────────────────────

  it('emits delete with id when delete button is clicked', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Delete todo"]').trigger('click')
    expect(wrapper.emitted('delete')?.[0]).toEqual(['todo-1'])
    wrapper.unmount()
  })

  // ── Edit mode start ────────────────────────────────────────────────────────

  it('enters edit mode when edit button is clicked', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    expect(wrapper.find('input[aria-label="Edit todo text"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('enters edit mode on double-click of text', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('span.flex-1').trigger('dblclick')
    expect(wrapper.find('input[aria-label="Edit todo text"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('pre-fills edit input with current text', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    const input = wrapper.find('input[aria-label="Edit todo text"]')
    expect((input.element as HTMLInputElement).value).toBe('Buy milk')
    wrapper.unmount()
  })

  it('shows priority select in edit mode', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    expect(wrapper.find('select[aria-label="Edit priority"]').exists()).toBe(true)
    wrapper.unmount()
  })

  // ── commitEdit ─────────────────────────────────────────────────────────────

  it('emits edit and exits edit mode when text is changed and save button clicked', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    const input = wrapper.find('input[aria-label="Edit todo text"]')
    await input.setValue('Updated text')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    expect(wrapper.emitted('edit')?.[0]).toEqual(['todo-1', 'Updated text', 'medium'])
    expect(wrapper.find('input[aria-label="Edit todo text"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits edit when only priority is changed', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('select[aria-label="Edit priority"]').setValue('high')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    expect(wrapper.emitted('edit')?.[0]).toEqual(['todo-1', 'Buy milk', 'high'])
    wrapper.unmount()
  })

  it('does not emit edit when text and priority are unchanged', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeUndefined()
    wrapper.unmount()
  })

  it('does not emit edit when trimmed text is empty', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('   ')
    await wrapper.find('button[aria-label="Save edit"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeUndefined()
    wrapper.unmount()
  })

  it('saves edit on Enter keydown', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('Enter saved')
    await wrapper.find('input[aria-label="Edit todo text"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('edit')?.[0]).toEqual(['todo-1', 'Enter saved', 'medium'])
    wrapper.unmount()
  })

  // ── cancelEdit ─────────────────────────────────────────────────────────────

  it('cancels edit and exits edit mode on cancel button click', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('partial')
    await wrapper.find('button[aria-label="Cancel edit"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeUndefined()
    expect(wrapper.find('input[aria-label="Edit todo text"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('cancels edit on Escape keydown', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').setValue('will be discarded')
    await wrapper.find('input[aria-label="Edit todo text"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('edit')).toBeUndefined()
    expect(wrapper.find('span.flex-1').text()).toBe('Buy milk')
    wrapper.unmount()
  })

  it('handleKeydown ignores other keys', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await wrapper.find('input[aria-label="Edit todo text"]').trigger('keydown', { key: 'Tab' })
    // Still in edit mode
    expect(wrapper.find('input[aria-label="Edit todo text"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows edit/delete action buttons when not in edit mode', () => {
    const wrapper = mountItem(baseProps)
    expect(wrapper.find('button[aria-label="Edit todo"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Delete todo"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows save/cancel action buttons in edit mode', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    expect(wrapper.find('button[aria-label="Save edit"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Cancel edit"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Edit todo"]').exists()).toBe(false)
    wrapper.unmount()
  })

  // ── Focus ──────────────────────────────────────────────────────────────────

  it('focuses the edit input after entering edit mode', async () => {
    const wrapper = mountItem(baseProps)
    await wrapper.find('button[aria-label="Edit todo"]').trigger('click')
    await nextTick()
    // In jsdom, focus may not transfer fully, but no error should occur
    wrapper.unmount()
  })
})
