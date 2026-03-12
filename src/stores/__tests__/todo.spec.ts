import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from '../todo'

const STORAGE_KEY = 'vue-todo-v1'

function makeStore() {
  setActivePinia(createPinia())
  return useTodoStore()
}

describe('useTodoStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // ── loadFromStorage ────────────────────────────────────────────────────────

  describe('loadFromStorage', () => {
    it('returns [] when storage is empty', () => {
      const store = makeStore()
      expect(store.items).toEqual([])
    })

    it('loads persisted todos on init', () => {
      const saved = [
        { id: 'a', text: 'Hello', completed: false, priority: 'low', createdAt: 1 },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      const store = makeStore()
      expect(store.items).toHaveLength(1)
      expect(store.items[0]?.text).toBe('Hello')
    })

    it('returns [] when stored JSON is corrupt', () => {
      // Force getItem to throw — triggers the catch branch
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('storage error')
      })
      const store = makeStore()
      expect(store.items).toEqual([])
    })
  })

  // ── scheduleSave ──────────────────────────────────────────────────────────

  describe('scheduleSave', () => {
    it('writes to localStorage after 300 ms debounce', () => {
      const store = makeStore()
      store.addTodo('debounced save test')
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull() // not yet
      vi.advanceTimersByTime(300)
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      expect(saved).toHaveLength(1)
    })

    it('silently swallows quota-exceeded error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const store = makeStore()
      store.addTodo('quota test')
      expect(() => vi.advanceTimersByTime(300)).not.toThrow()
    })

    it('debounces: only one save fires for rapid mutations', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.addTodo('c')
      vi.advanceTimersByTime(300)
      expect(setItemSpy).toHaveBeenCalledTimes(1)
    })
  })

  // ── addTodo ────────────────────────────────────────────────────────────────

  describe('addTodo', () => {
    it('adds a todo with default medium priority', () => {
      const store = makeStore()
      store.addTodo('Buy milk')
      expect(store.items).toHaveLength(1)
      expect(store.items[0]?.text).toBe('Buy milk')
      expect(store.items[0]?.priority).toBe('medium')
      expect(store.items[0]?.completed).toBe(false)
    })

    it('trims whitespace from text', () => {
      const store = makeStore()
      store.addTodo('  Hello world  ')
      expect(store.items[0]?.text).toBe('Hello world')
    })

    it('ignores empty / whitespace-only text', () => {
      const store = makeStore()
      store.addTodo('')
      store.addTodo('   ')
      expect(store.items).toHaveLength(0)
    })

    it('accepts explicit priority', () => {
      const store = makeStore()
      store.addTodo('Urgent', 'high')
      expect(store.items[0]?.priority).toBe('high')
    })

    it('prepends new todos (most recent first)', () => {
      const store = makeStore()
      store.addTodo('First')
      store.addTodo('Second')
      expect(store.items[0]?.text).toBe('Second')
    })
  })

  // ── toggleTodo ─────────────────────────────────────────────────────────────

  describe('toggleTodo', () => {
    it('marks an active todo as completed (sets completedAt)', () => {
      const store = makeStore()
      store.addTodo('test')
      const id = store.items[0]!.id
      store.toggleTodo(id)
      expect(store.items[0]?.completed).toBe(true)
      expect(store.items[0]?.completedAt).toBeDefined()
    })

    it('marks a completed todo as active (clears completedAt)', () => {
      const store = makeStore()
      store.addTodo('test')
      const id = store.items[0]!.id
      store.toggleTodo(id) // → completed
      store.toggleTodo(id) // → active
      expect(store.items[0]?.completed).toBe(false)
      expect(store.items[0]?.completedAt).toBeUndefined()
    })

    it('does nothing for unknown id', () => {
      const store = makeStore()
      store.addTodo('test')
      expect(() => store.toggleTodo('nonexistent')).not.toThrow()
      expect(store.items).toHaveLength(1)
    })
  })

  // ── deleteTodo ─────────────────────────────────────────────────────────────

  describe('deleteTodo', () => {
    it('removes the todo by id', () => {
      const store = makeStore()
      store.addTodo('delete me')
      const id = store.items[0]!.id
      store.deleteTodo(id)
      expect(store.items).toHaveLength(0)
    })

    it('does nothing for unknown id', () => {
      const store = makeStore()
      store.addTodo('keep me')
      expect(() => store.deleteTodo('unknown')).not.toThrow()
      expect(store.items).toHaveLength(1)
    })
  })

  // ── editTodo ───────────────────────────────────────────────────────────────

  describe('editTodo', () => {
    it('updates text and priority', () => {
      const store = makeStore()
      store.addTodo('original', 'low')
      const id = store.items[0]!.id
      store.editTodo(id, 'updated', 'high')
      expect(store.items[0]?.text).toBe('updated')
      expect(store.items[0]?.priority).toBe('high')
    })

    it('keeps original text when new text trims to empty', () => {
      const store = makeStore()
      store.addTodo('keep this')
      const id = store.items[0]!.id
      store.editTodo(id, '   ')
      expect(store.items[0]?.text).toBe('keep this')
    })

    it('keeps original priority when priority arg is omitted', () => {
      const store = makeStore()
      store.addTodo('item', 'high')
      const id = store.items[0]!.id
      store.editTodo(id, 'new text')
      expect(store.items[0]?.priority).toBe('high')
    })

    it('does nothing for unknown id', () => {
      const store = makeStore()
      expect(() => store.editTodo('unknown', 'text')).not.toThrow()
    })

    it('preserves other todos unchanged when editing one of many', () => {
      const store = makeStore()
      store.addTodo('first')
      store.addTodo('second')
      store.addTodo('third')
      const secondId = store.items.find((t) => t.text === 'second')!.id
      store.editTodo(secondId, 'SECOND')
      expect(store.items.find((t) => t.id === secondId)?.text).toBe('SECOND')
      expect(store.items.find((t) => t.text === 'first')).toBeDefined()
      expect(store.items.find((t) => t.text === 'third')).toBeDefined()
    })
  })

  // ── clearCompleted ─────────────────────────────────────────────────────────

  describe('clearCompleted', () => {
    it('removes all completed todos', () => {
      const store = makeStore()
      store.addTodo('active')
      store.addTodo('done')
      store.toggleTodo(store.items[0]!.id) // 'done' → completed
      store.clearCompleted()
      expect(store.items).toHaveLength(1)
      expect(store.items[0]?.text).toBe('active')
    })

    it('does nothing when no completed todos', () => {
      const store = makeStore()
      store.addTodo('active')
      store.clearCompleted()
      expect(store.items).toHaveLength(1)
    })
  })

  // ── toggleAll ──────────────────────────────────────────────────────────────

  describe('toggleAll', () => {
    it('marks all active todos as completed when not all done', () => {
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.toggleAll()
      expect(store.items.every((t) => t.completed)).toBe(true)
    })

    it('marks all completed todos as active when all are done', () => {
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.toggleAll() // all → completed
      store.toggleAll() // all → active
      expect(store.items.every((t) => !t.completed)).toBe(true)
      expect(store.items.every((t) => t.completedAt === undefined)).toBe(true)
    })

    it('does nothing on empty list', () => {
      const store = makeStore()
      expect(() => store.toggleAll()).not.toThrow()
      expect(store.items).toHaveLength(0)
    })
  })

  // ── batchImport ────────────────────────────────────────────────────────────

  describe('batchImport', () => {
    it('replaces all items with imported data', () => {
      const store = makeStore()
      store.addTodo('old')
      store.batchImport([{ text: 'imported 1' }, { text: 'imported 2' }])
      expect(store.items).toHaveLength(2)
      expect(store.items[0]?.text).toBe('imported 1')
    })

    it('fills missing fields with defaults', () => {
      const store = makeStore()
      store.batchImport([{ text: 'minimal' }])
      const item = store.items[0]!
      expect(item.completed).toBe(false)
      expect(item.priority).toBe('medium')
      expect(item.createdAt).toBeDefined()
    })

    it('preserves explicitly provided fields', () => {
      const now = Date.now()
      const store = makeStore()
      store.batchImport([
        {
          id: 'custom-id',
          text: 'full',
          completed: true,
          priority: 'high',
          createdAt: now,
          completedAt: now + 1,
        },
      ])
      const item = store.items[0]!
      expect(item.id).toBe('custom-id')
      expect(item.completed).toBe(true)
      expect(item.priority).toBe('high')
      expect(item.completedAt).toBe(now + 1)
    })
  })

  // ── filteredItems ──────────────────────────────────────────────────────────

  describe('filteredItems', () => {
    it('returns all items when filter = "all"', () => {
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.toggleTodo(store.items[0]!.id)
      store.filter = 'all'
      expect(store.filteredItems).toHaveLength(2)
    })

    it('returns only active items when filter = "active"', () => {
      const store = makeStore()
      store.addTodo('active')
      store.addTodo('done')
      store.toggleTodo(store.items[0]!.id) // done → completed
      store.filter = 'active'
      expect(store.filteredItems).toHaveLength(1)
      expect(store.filteredItems[0]?.text).toBe('active')
    })

    it('returns only completed items when filter = "completed"', () => {
      const store = makeStore()
      store.addTodo('active')
      store.addTodo('done')
      store.toggleTodo(store.items[0]!.id)
      store.filter = 'completed'
      expect(store.filteredItems).toHaveLength(1)
      expect(store.filteredItems[0]?.completed).toBe(true)
    })

    it('filters by search query (case-insensitive)', () => {
      const store = makeStore()
      store.addTodo('Buy milk')
      store.addTodo('Read book')
      store.searchQuery = 'MILK'
      expect(store.filteredItems).toHaveLength(1)
      expect(store.filteredItems[0]?.text).toBe('Buy milk')
    })

    it('returns all items when search query is empty', () => {
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.searchQuery = ''
      expect(store.filteredItems).toHaveLength(2)
    })

    it('combines filter and search', () => {
      const store = makeStore()
      store.addTodo('Buy milk') // active
      store.addTodo('Buy eggs') // active
      store.addTodo('Read book')
      store.toggleTodo(store.items[0]!.id) // 'Read book' → completed
      store.filter = 'active'
      store.searchQuery = 'buy'
      expect(store.filteredItems).toHaveLength(2)
    })
  })

  // ── stats ─────────────────────────────────────────────────────────────────

  describe('stats', () => {
    it('returns zeros for empty list', () => {
      const store = makeStore()
      expect(store.stats).toEqual({ total: 0, completed: 0, active: 0, allDone: false })
    })

    it('correctly counts active and completed', () => {
      const store = makeStore()
      store.addTodo('a')
      store.addTodo('b')
      store.addTodo('c')
      store.toggleTodo(store.items[0]!.id)
      expect(store.stats.total).toBe(3)
      expect(store.stats.completed).toBe(1)
      expect(store.stats.active).toBe(2)
      expect(store.stats.allDone).toBe(false)
    })

    it('allDone is true when all items are completed', () => {
      const store = makeStore()
      store.addTodo('a')
      store.toggleTodo(store.items[0]!.id)
      expect(store.stats.allDone).toBe(true)
    })
  })
})
