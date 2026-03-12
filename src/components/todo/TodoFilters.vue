<script setup lang="ts">
import type { FilterMode } from '@/stores/todo'
import { cn } from '@/lib/utils'

defineProps<{
  modelValue: FilterMode
  activeCount: number
  completedCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterMode]
  clearCompleted: []
  toggleAll: []
}>()

const filters: { value: FilterMode; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <!-- Toggle all -->
    <button
      type="button"
      class="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      :aria-label="activeCount === 0 ? 'Mark all active' : 'Mark all completed'"
      @click="emit('toggleAll')"
    >
      {{ activeCount === 0 ? 'Uncheck all' : 'Check all' }}
    </button>

    <!-- Filter tabs -->
    <nav
      role="tablist"
      aria-label="Filter todos"
      class="flex rounded-lg border border-border overflow-hidden"
    >
      <button
        v-for="f in filters"
        :key="f.value"
        role="tab"
        type="button"
        :aria-selected="modelValue === f.value"
        :class="cn(
          'px-3 py-1.5 text-xs font-medium transition-colors',
          modelValue === f.value
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
        )"
        @click="emit('update:modelValue', f.value)"
      >
        {{ f.label }}
      </button>
    </nav>

    <!-- Clear completed -->
    <button
      v-if="completedCount > 0"
      type="button"
      class="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      :aria-label="`Clear ${completedCount} completed todos`"
      @click="emit('clearCompleted')"
    >
      Clear {{ completedCount }} done
    </button>
    <span v-else class="text-xs text-muted-foreground">
      {{ activeCount }} item{{ activeCount !== 1 ? 's' : '' }} left
    </span>
  </div>
</template>
