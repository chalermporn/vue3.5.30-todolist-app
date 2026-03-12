<script setup lang="ts">
/**
 * TodoItem — rendered inside the virtual list.
 * Props are intentionally flat (no nested object) to let Vue track changes cheaply.
 */
import { ref, nextTick } from 'vue'
import type { Priority } from '@/stores/todo'
import { cn } from '@/lib/utils'

const props = defineProps<{
  id: string
  text: string
  completed: boolean
  priority: Priority
}>()

const emit = defineEmits<{
  toggle: [id: string]
  delete: [id: string]
  edit:   [id: string, text: string, priority: Priority]
}>()

const editing = ref(false)
const editText = ref('')
const editPriority = ref<Priority>(props.priority)
const editInputRef = ref<HTMLInputElement | null>(null)

const priorityRing: Record<Priority, string> = {
  low:    'ring-success/40',
  medium: 'ring-border',
  high:   'ring-destructive/60',
}

const priorityDot: Record<Priority, string> = {
  low:    'bg-success',
  medium: 'bg-muted-foreground',
  high:   'bg-destructive',
}

function startEdit() {
  editText.value = props.text
  editPriority.value = props.priority
  editing.value = true
  nextTick(() => editInputRef.value?.focus())
}

function commitEdit() {
  const trimmed = editText.value.trim()
  if (trimmed && trimmed !== props.text || editPriority.value !== props.priority) {
    emit('edit', props.id, trimmed || props.text, editPriority.value)
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitEdit()
  if (e.key === 'Escape') cancelEdit()
}
</script>

<template>
  <li
    :class="cn(
      'group flex items-center gap-3 rounded-xl border px-4 py-3 ring-1 transition-all',
      'bg-card text-card-foreground',
      priorityRing[priority],
      completed && 'opacity-60'
    )"
    :aria-label="`Todo: ${text}`"
  >
    <!-- Checkbox -->
    <button
      type="button"
      role="checkbox"
      :aria-checked="completed"
      :aria-label="completed ? 'Mark as active' : 'Mark as completed'"
      :class="cn(
        'shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors',
        completed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-primary/60'
      )"
      @click="emit('toggle', id)"
    >
      <svg
        v-if="completed"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-3 w-3"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>

    <!-- Priority dot -->
    <span
      :class="cn('shrink-0 h-2 w-2 rounded-full', priorityDot[priority])"
      :aria-label="`Priority: ${priority}`"
    />

    <!-- Text / Edit input -->
    <template v-if="editing">
      <input
        ref="editInputRef"
        v-model="editText"
        type="text"
        maxlength="500"
        aria-label="Edit todo text"
        class="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @blur="commitEdit"
        @keydown="handleKeydown"
      />
      <!-- Priority toggle while editing -->
      <select
        v-model="editPriority"
        aria-label="Edit priority"
        class="shrink-0 rounded border border-border bg-background px-1 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </template>

    <span
      v-else
      :class="cn(
        'flex-1 min-w-0 text-sm break-words cursor-pointer select-none',
        completed && 'line-through text-muted-foreground'
      )"
      @dblclick="startEdit"
    >
      {{ text }}
    </span>

    <!-- Action buttons — visible on hover / focus-within -->
    <div
      v-if="!editing"
      class="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
    >
      <button
        type="button"
        aria-label="Edit todo"
        class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="startEdit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="h-3.5 w-3.5" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button
        type="button"
        aria-label="Delete todo"
        class="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="emit('delete', id)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="h-3.5 w-3.5" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>

    <!-- Edit save/cancel -->
    <div v-else class="shrink-0 flex gap-1">
      <button
        type="button"
        aria-label="Save edit"
        class="rounded-md p-1 text-success hover:bg-success/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="commitEdit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          class="h-3.5 w-3.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <button
        type="button"
        aria-label="Cancel edit"
        class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="cancelEdit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          class="h-3.5 w-3.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </li>
</template>
