<script setup lang="ts">
import { ref } from 'vue'
import type { Priority } from '@/stores/todo'
import { cn } from '@/lib/utils'

const emit = defineEmits<{
  add: [text: string, priority: Priority]
}>()

const text = ref('')
const priority = ref<Priority>('medium')
const inputRef = ref<HTMLInputElement | null>(null)

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: 'text-success' },
  { value: 'medium', label: 'Med',    color: 'text-foreground' },
  { value: 'high',   label: 'High',   color: 'text-destructive' },
]

function submit() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('add', trimmed, priority.value)
  text.value = ''
  priority.value = 'medium'
  inputRef.value?.focus()
}
</script>

<template>
  <form
    class="flex gap-2"
    aria-label="Add a new todo"
    @submit.prevent="submit"
  >
    <!-- Priority selector -->
    <div class="flex rounded-lg border border-border overflow-hidden shrink-0">
      <button
        v-for="p in priorities"
        :key="p.value"
        type="button"
        :aria-label="`Set priority to ${p.label}`"
        :aria-pressed="priority === p.value"
        :class="cn(
          'px-2.5 py-2 text-xs font-medium transition-colors',
          p.color,
          priority === p.value
            ? 'bg-muted'
            : 'bg-background hover:bg-muted/60'
        )"
        @click="priority = p.value"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Text input -->
    <input
      ref="inputRef"
      v-model="text"
      type="text"
      placeholder="What needs to be done?"
      maxlength="500"
      autocomplete="off"
      aria-label="New todo text"
      class="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
      @keydown.escape="text = ''"
    />

    <!-- Submit -->
    <button
      type="submit"
      :disabled="!text.trim()"
      class="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Add todo"
    >
      Add
    </button>
  </form>
</template>
