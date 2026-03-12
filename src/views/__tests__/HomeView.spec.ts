import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../HomeView.vue'

// Stub RouterLink to avoid needing a full router instance
const stubs = {
  RouterLink: {
    props: ['to'],
    template: '<a class="router-link-stub"><slot /></a>',
  },
}

describe('HomeView', () => {
  it('renders Vue Todo heading', () => {
    const wrapper = mount(HomeView, { global: { stubs } })
    expect(wrapper.find('h1').text()).toBe('Vue Todo')
  })

  it('renders "Open Todos" link', () => {
    const wrapper = mount(HomeView, { global: { stubs } })
    expect(wrapper.find('a.router-link-stub').text()).toContain('Open Todos')
  })

  it('renders all 6 feature highlight items', () => {
    const wrapper = mount(HomeView, { global: { stubs } })
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(6)
  })

  it('feature list includes virtual scroll and dark mode highlights', () => {
    const wrapper = mount(HomeView, { global: { stubs } })
    const text = wrapper.text()
    expect(text).toContain('Virtual scroll')
    expect(text).toContain('Dark / light mode')
    expect(text).toContain('Priority levels')
    expect(text).toContain('Persisted to localStorage')
  })
})
