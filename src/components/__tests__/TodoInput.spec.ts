import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoInput from '../todo/TodoInput.vue'

function mountInput() {
  return mount(TodoInput)
}

describe('TodoInput', () => {
  it('renders the text input and Add button', () => {
    const wrapper = mountInput()
    expect(wrapper.find('input[aria-label="New todo text"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Add todo"]').exists()).toBe(true)
  })

  it('renders all three priority buttons', () => {
    const wrapper = mountInput()
    const priorityBtns = wrapper.findAll('button[type="button"]')
    const labels = priorityBtns.map((b) => b.text())
    expect(labels).toContain('Low')
    expect(labels).toContain('Med')
    expect(labels).toContain('High')
  })

  it('Add button is disabled when input is empty', () => {
    const wrapper = mountInput()
    const addBtn = wrapper.find('button[aria-label="Add todo"]')
    expect((addBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('Add button is enabled after typing text', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('Buy milk')
    const addBtn = wrapper.find('button[aria-label="Add todo"]')
    expect((addBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('emits "add" with trimmed text and default medium priority on submit', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('  Buy eggs  ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('add')).toEqual([['Buy eggs', 'medium']])
  })

  it('emits "add" with selected priority', async () => {
    const wrapper = mountInput()
    await wrapper.find('button[aria-label="Set priority to High"]').trigger('click')
    await wrapper.find('input').setValue('Urgent task')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('add')).toEqual([['Urgent task', 'high']])
  })

  it('clears input and resets priority to medium after submit', async () => {
    const wrapper = mountInput()
    await wrapper.find('button[aria-label="Set priority to Low"]').trigger('click')
    await wrapper.find('input').setValue('task')
    await wrapper.find('form').trigger('submit')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
    // After reset, medium priority button should be pressed
    const medBtn = wrapper.find('button[aria-label="Set priority to Med"]')
    expect(medBtn.attributes('aria-pressed')).toBe('true')
  })

  it('does not emit when submitting with only whitespace', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('Escape key clears the input', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')
    await input.setValue('partial text')
    await input.trigger('keydown.escape')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('clicking priority button updates aria-pressed', async () => {
    const wrapper = mountInput()
    const lowBtn = wrapper.find('button[aria-label="Set priority to Low"]')
    await lowBtn.trigger('click')
    expect(lowBtn.attributes('aria-pressed')).toBe('true')
    const medBtn = wrapper.find('button[aria-label="Set priority to Med"]')
    expect(medBtn.attributes('aria-pressed')).toBe('false')
  })
})
