/**
 * High-performance Todo store.
 *
 * Design decisions for ~100k item throughput:
 * - `shallowRef` on the items array  → Vue only tracks array *reference*, not
 *   deep item properties, so mutations that swap the reference are O(1) in the
 *   reactivity system.
 * - `Map<string, Todo>` index        → O(1) toggle/delete instead of O(n) find.
 * - Immutable item update pattern    → spread-create a new object so the list
 *   can be swapped atomically without mutating shared state.
 * - Debounced persistence            → localStorage writes are batched to avoid
 *   blocking the main thread on every keystroke / toggle.
 */

import { defineStore } from 'pinia'
import { computed, ref, shallowRef, triggerRef } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high'
export type FilterMode = 'all' | 'active' | 'completed'

export interface Todo {
  readonly id: string
  readonly text: string
  readonly completed: boolean
  readonly priority: Priority
  readonly createdAt: number
  readonly completedAt?: number
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'vue-todo-v1'

function loadFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch {
    return []
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(items: readonly Todo[]) {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Quota exceeded — silent fail; app still works in-memory
    }
  }, 300)
}

// ─── ID generation ────────────────────────────────────────────────────────────

let _seq = 0
function uid(): string {
  return `${Date.now().toString(36)}-${(++_seq).toString(36)}`
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTodoStore = defineStore('todo', () => {
  // Primary state — shallowRef so Vue never deep-tracks 100k Todo objects
  const items = shallowRef<readonly Todo[]>(loadFromStorage())
  const filter = ref<FilterMode>('all')
  const searchQuery = ref('')

  // O(1) lookup index: id → Todo
  const _index = new Map<string, Todo>()
  items.value.forEach((t) => _index.set(t.id, t))

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _commit(next: readonly Todo[]) {
    // Replace the entire array reference (shallowRef style)
    items.value = next
    triggerRef(items)
    scheduleSave(next)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function addTodo(text: string, priority: Priority = 'medium') {
    const trimmed = text.trim()
    if (!trimmed) return

    const todo: Todo = {
      id: uid(),
      text: trimmed,
      completed: false,
      priority,
      createdAt: Date.now(),
    }
    _index.set(todo.id, todo)
    _commit([todo, ...items.value])
  }

  function toggleTodo(id: string) {
    const todo = _index.get(id)
    if (!todo) return

    const updated: Todo = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? Date.now() : undefined,
    }
    _index.set(id, updated)
    _commit(items.value.map((t) => (t.id === id ? updated : t)))
  }

  function deleteTodo(id: string) {
    if (!_index.has(id)) return
    _index.delete(id)
    _commit(items.value.filter((t) => t.id !== id))
  }

  function editTodo(id: string, text: string, priority?: Priority) {
    const todo = _index.get(id)
    if (!todo) return

    const updated: Todo = {
      ...todo,
      text: text.trim() || todo.text,
      priority: priority ?? todo.priority,
    }
    _index.set(id, updated)
    _commit(items.value.map((t) => (t.id === id ? updated : t)))
  }

  function clearCompleted() {
    const next = items.value.filter((t) => {
      if (t.completed) { _index.delete(t.id); return false }
      return true
    })
    _commit(next)
  }

  function toggleAll() {
    const allDone = items.value.every((t) => t.completed)
    const now = Date.now()
    const next = items.value.map((t) => {
      const updated: Todo = { ...t, completed: !allDone, completedAt: !allDone ? now : undefined }
      _index.set(t.id, updated)
      return updated
    })
    _commit(next)
  }

  /**
   * Batch-import todos — designed for stress-testing with large datasets.
   * Accepts an array of partial Todo data; fills in missing fields.
   */
  function batchImport(data: Array<Partial<Todo> & { text: string }>) {
    _index.clear()
    const now = Date.now()
    const next: Todo[] = data.map((d, i) => {
      const todo: Todo = {
        id: d.id ?? `imported-${i}-${Date.now().toString(36)}`,
        text: d.text,
        completed: d.completed ?? false,
        priority: d.priority ?? 'medium',
        createdAt: d.createdAt ?? now - i,
        completedAt: d.completedAt,
      }
      _index.set(todo.id, todo)
      return todo
    })
    _commit(next)
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  const filteredItems = computed(() => {
    const q = searchQuery.value.toLowerCase()
    const f = filter.value

    return items.value.filter((t) => {
      const matchesFilter =
        f === 'all' ||
        (f === 'active' && !t.completed) ||
        (f === 'completed' && t.completed)

      const matchesSearch = !q || t.text.toLowerCase().includes(q)

      return matchesFilter && matchesSearch
    })
  })

  const stats = computed(() => {
    const total = items.value.length
    const completed = items.value.reduce((n, t) => n + (t.completed ? 1 : 0), 0)
    return {
      total,
      completed,
      active: total - completed,
      allDone: total > 0 && completed === total,
    }
  })

  return {
    // State
    items,
    filter,
    searchQuery,
    // Derived
    filteredItems,
    stats,
    // Actions
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    toggleAll,
    batchImport,
  }
})
