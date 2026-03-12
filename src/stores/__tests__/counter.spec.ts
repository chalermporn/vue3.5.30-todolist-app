import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('useCounterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises count to 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('doubleCount reflects count * 2', () => {
    const store = useCounterStore()
    expect(store.doubleCount).toBe(0)
    store.count = 3
    expect(store.doubleCount).toBe(6)
  })

  it('increment increments count by 1', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
    store.increment()
    expect(store.count).toBe(2)
  })
})
