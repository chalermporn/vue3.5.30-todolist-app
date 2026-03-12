<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-dvh gap-6 px-4 bg-background text-foreground">
    <div class="text-center space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">Vue Todo</h1>
      <p class="text-muted-foreground text-sm max-w-xs">
        A world-class todo app built with Vue 3.5, Pinia v3, Vue Router v5 &amp; Tailwind CSS v4.
        Handles 100k+ items with virtual scrolling.
      </p>
    </div>

    <RouterLink
      :to="{ name: 'todos' }"
      class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Open Todos
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        class="h-4 w-4" aria-hidden="true">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </RouterLink>

    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md text-sm text-muted-foreground">
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> Virtual scroll (100k+ items)
      </li>
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> Dark / light mode
      </li>
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> Priority levels
      </li>
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> Persisted to localStorage
      </li>
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> WCAG accessible
      </li>
      <li class="flex items-center gap-2 rounded-lg border border-border px-4 py-3 bg-card">
        <span class="text-success">✓</span> Inline edit + search
      </li>
    </ul>
  </main>
</template>
