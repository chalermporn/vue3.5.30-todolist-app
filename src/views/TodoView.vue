<script setup lang="ts">
/**
 * TodoView — main page for the todo feature.
 *
 * Performance notes:
 * - The store holds items in a shallowRef, so this view is only re-rendered
 *   when the array reference changes (not on every property change).
 * - Virtual list inside TodoList handles 100k+ items without DOM bloat.
 * - Stress-test button is provided to verify performance with large datasets.
 */
import { useTodoStore } from '@/stores/todo'
import TodoInput from '@/components/todo/TodoInput.vue'
import TodoFilters from '@/components/todo/TodoFilters.vue'
import TodoList from '@/components/todo/TodoList.vue'

const store = useTodoStore()

function toggleDark() {
  document.documentElement.classList.toggle('dark')
}

/** Generate N fake todos for performance testing */
function stressTest(n = 10_000) {
  const priorities = ['low', 'medium', 'high'] as const
  store.batchImport(
    Array.from({ length: n }, (_, i) => ({
      text: `Stress-test todo #${i + 1}`,
      priority: priorities[i % 3],
      completed: i % 4 === 0,
    })),
  )
}
</script>

<template>
  <main class="flex flex-col h-dvh max-w-2xl mx-auto px-4 py-6 gap-4">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">
          My Todos
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ store.stats.active }} active · {{ store.stats.completed }} done
          <span v-if="store.stats.total > 0"> · {{ store.stats.total }} total</span>
        </p>
      </div>

      <!-- Dark-mode toggle -->
      <button
        type="button"
        aria-label="Toggle dark mode"
        class="rounded-lg border border-border bg-background p-2 text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="toggleDark"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="h-4 w-4" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </header>

    <!-- ── Search ──────────────────────────────────────────────────────────── -->
    <input
      v-model="store.searchQuery"
      type="search"
      placeholder="Search todos…"
      aria-label="Search todos"
      class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    />

    <!-- ── Add input ───────────────────────────────────────────────────────── -->
    <TodoInput @add="store.addTodo" />

    <!-- ── Filters ─────────────────────────────────────────────────────────── -->
    <TodoFilters
      v-model="store.filter"
      :active-count="store.stats.active"
      :completed-count="store.stats.completed"
      :total-count="store.stats.total"
      @clear-completed="store.clearCompleted"
      @toggle-all="store.toggleAll"
    />

    <!-- ── Virtual list ────────────────────────────────────────────────────── -->
    <TodoList
      :items="store.filteredItems"
      class="flex-1 min-h-0"
      @toggle="store.toggleTodo"
      @delete="store.deleteTodo"
      @edit="(id, text, priority) => store.editTodo(id, text, priority)"
    />

    <!-- ── Footer / stress test ────────────────────────────────────────────── -->
    <footer class="flex items-center justify-between pt-2 border-t border-border">
      <p class="text-xs text-muted-foreground">
        Double-click any item to edit
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-xs text-muted-foreground border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @click="stressTest(10_000)"
        >
          +10k items
        </button>
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-xs text-muted-foreground border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @click="stressTest(100_000)"
        >
          +100k items
        </button>
      </div>
    </footer>
  </main>
</template>
