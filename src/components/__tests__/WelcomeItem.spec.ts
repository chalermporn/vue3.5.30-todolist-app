import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeItem from '../WelcomeItem.vue'

describe('WelcomeItem', () => {
  it('renders default slot content', () => {
    const wrapper = mount(WelcomeItem, {
      slots: { default: '<p>Body content</p>' },
    })
    expect(wrapper.text()).toContain('Body content')
  })

  it('renders heading slot content', () => {
    const wrapper = mount(WelcomeItem, {
      slots: { heading: 'My Heading' },
    })
    expect(wrapper.find('h3').text()).toBe('My Heading')
  })

  it('renders icon slot content', () => {
    const wrapper = mount(WelcomeItem, {
      slots: { icon: '<svg data-testid="icon"></svg>' },
    })
    expect(wrapper.find('i svg').exists()).toBe(true)
  })
})
