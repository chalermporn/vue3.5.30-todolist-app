/**
 * Vue Router v5 — best practices applied:
 * - Typed routes via RouteRecordInfo + declare module augmentation
 * - Eager-load only the initial view; everything else is lazy (code-split)
 * - Route-level meta for page <title>
 * - Navigation guard sets document.title automatically
 * - scrollBehavior restores scroll position on back/forward
 */
import { createRouter, createWebHistory } from 'vue-router'

// ─── Typed routes ─────────────────────────────────────────────────────────────
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    /** Require the todo store to be ready before entering */
    requiresTodoStore?: boolean
  }
}

// ─── Route definitions ────────────────────────────────────────────────────────

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },

  routes: [
    {
      path: '/',
      name: 'home',
      // Eager-load: this is the landing page; zero latency matters
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Home' },
    },
    {
      path: '/todos',
      name: 'todos',
      // Lazy-load + separate chunk — only downloaded when user navigates here
      component: () => import('../views/TodoView.vue'),
      meta: { title: 'My Todos', requiresTodoStore: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { title: 'About' },
    },
    // Catch-all — redirect unknown paths to home
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'home' },
    },
  ],
})

// ─── Global navigation guard — sets <title> ───────────────────────────────────
router.afterEach((to) => {
  const base = 'Vue Todo'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router
