import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '../AboutView.vue'

describe('AboutView', () => {
  it('renders the about page heading', () => {
    const wrapper = mount(AboutView)
    expect(wrapper.find('h1').text()).toBe('This is an about page')
  })

  it('has a .about wrapper div', () => {
    const wrapper = mount(AboutView)
    expect(wrapper.find('.about').exists()).toBe(true)
  })
})
