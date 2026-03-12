import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TheWelcome from '../TheWelcome.vue'

describe('TheWelcome', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all five welcome sections', () => {
    const wrapper = mount(TheWelcome)
    const items = wrapper.findAll('.item')
    expect(items).toHaveLength(5)
  })

  it('calls fetch with open-in-editor URL when README link is clicked', async () => {
    const wrapper = mount(TheWelcome)
    const readmeLink = wrapper.find('a[href="javascript:void(0)"]')
    await readmeLink.trigger('click')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/__open-in-editor?file=README.md')
  })

  it('renders heading text for each section', () => {
    const wrapper = mount(TheWelcome)
    const text = wrapper.text()
    expect(text).toContain('Documentation')
    expect(text).toContain('Tooling')
    expect(text).toContain('Ecosystem')
    expect(text).toContain('Community')
    expect(text).toContain('Support Vue')
  })
})
