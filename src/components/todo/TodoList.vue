<script setup lang="ts">
/**
 * Virtual scrolling list.
 *
 * Renders only the items visible inside the scrollable viewport plus an
 * overscan buffer, so the DOM never contains more than ~40 nodes regardless
 * of how large the total list is (100k items → same DOM cost as 40).
 *
 * Algorithm:
 *   - All items have a fixed row height (ITEM_H px).
 *   - Track `scrollTop` and derive first/last visible indices.
 *   - Pad the list with invisible spacer divs above and below the rendered
 *     slice so the scrollbar remains accurate.
 */
import { computed, ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import type { Todo, Priority } from '@/stores/todo'
import TodoItem from './TodoItem.vue'

const props = defineProps<{
  items: readonly Todo[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  delete: [id: string]
  edit:   [id: string, text: string, priority: Priority]
}>()

const ITEM_H   = 60  // px — approximate row height (including gap)
const OVERSCAN = 5   // extra rows above & below viewport

const containerRef = useTemplateRef<HTMLElement>('container')
const containerHeight = ref(0)
const scrollTop = ref(0)

// ResizeObserver watches the container so we always have the right height
let ro: ResizeObserver | null = null
onMounted(() => {
  const el = containerRef.value
  if (!el) return
  containerHeight.value = el.clientHeight
  ro = new ResizeObserver(([entry]) => {
    if (entry) containerHeight.value = entry.contentRect.height
  })
  ro.observe(el)
})
onBeforeUnmount(() => ro?.disconnect())

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

const totalHeight = computed(() => props.items.length * ITEM_H)

const visibleSlice = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / ITEM_H) - OVERSCAN)
  const visibleCount = Math.ceil(containerHeight.value / ITEM_H)
  const end = Math.min(props.items.length, start + visibleCount + OVERSCAN * 2)
  return {
    start,
    end,
    offsetTop: start * ITEM_H,
    offsetBottom: (props.items.length - end) * ITEM_H,
    items: props.items.slice(start, end),
  }
})
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="items.length === 0"
    class="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
    role="status"
    aria-live="polite"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
      class="h-12 w-12 opacity-30" aria-hidden="true">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
    <p class="text-sm font-medium">Nothing here yet</p>
    <p class="text-xs">Add a todo above to get started</p>
  </div>

  <!-- Virtual scroll container -->
  <div
    v-else
    ref="container"
    class="overflow-y-auto flex-1 min-h-0 pr-1"
    style="contain: strict"
    :aria-label="`Todo list, ${items.length} items`"
    role="region"
    @scroll.passive="onScroll"
  >
    <!-- Total height spacer wrapping the visible slice -->
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <ul
        class="flex flex-col gap-2 absolute left-0 right-0"
        :style="{ top: visibleSlice.offsetTop + 'px' }"
        aria-label="Todos"
      >
        <TodoItem
          v-for="todo in visibleSlice.items"
          :key="todo.id"
          :id="todo.id"
          :text="todo.text"
          :completed="todo.completed"
          :priority="todo.priority"
          @toggle="emit('toggle', $event)"
          @delete="emit('delete', $event)"
          @edit="(id: string, text: string, priority: Priority) => emit('edit', id, text, priority)"
        />
      </ul>
    </div>
  </div>
</template>
