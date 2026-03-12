import { describe, it, expect, beforeEach } from 'vitest'
import router from '../index'

describe('router', () => {
  beforeEach(async () => {
    await router.push('/')
    await router.isReady()
  })

  it('navigates to home route', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('navigates to todos route', async () => {
    await router.push('/todos')
    expect(router.currentRoute.value.name).toBe('todos')
  })

  it('navigates to about route', async () => {
    await router.push('/about')
    expect(router.currentRoute.value.name).toBe('about')
  })

  it('redirects unknown paths to home', async () => {
    await router.push('/does-not-exist')
    expect(router.currentRoute.value.name).toBe('home')
  })

  // ── afterEach navigation guard ────────────────────────────────────────────

  it('sets document.title with route meta.title', async () => {
    await router.push('/todos')
    expect(document.title).toBe('My Todos · Vue Todo')
  })

  it('sets document.title for home', async () => {
    await router.push('/')
    expect(document.title).toBe('Home · Vue Todo')
  })

  it('sets base-only title when meta.title is empty string', async () => {
    // Add a temporary route with empty title to cover the falsy branch
    router.addRoute({ path: '/test-no-title', name: 'test-no-title', component: {}, meta: { title: '' } })
    await router.push('/test-no-title')
    expect(document.title).toBe('Vue Todo')
    router.removeRoute('test-no-title')
  })

  // ── scrollBehavior ────────────────────────────────────────────────────────

  it('scrollBehavior returns savedPosition when provided', () => {
    const sb = (router.options as any).scrollBehavior as Function
    const saved = { left: 0, top: 200 }
    expect(sb({}, {}, saved)).toBe(saved)
  })

  it('scrollBehavior returns top:0 when no savedPosition', () => {
    const sb = (router.options as any).scrollBehavior as Function
    expect(sb({}, {}, null)).toEqual({ top: 0, behavior: 'smooth' })
  })
})
