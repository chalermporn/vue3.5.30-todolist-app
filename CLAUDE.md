# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev          # Start dev server (Vite)

# Build
bun run build        # Type-check + production build (parallel)
bun run build-only   # Production build only (skip type-check)
bun run preview      # Preview production build

# Testing
bun run test:unit    # Run unit tests (Vitest, watch mode)
bun run test:e2e     # Run E2E tests (Playwright)

# Run a single unit test file
bun run test:unit src/components/__tests__/HelloWorld.spec.ts

# Lint & Format
bun run lint         # Run all linters (oxlint + eslint) with auto-fix
bun run format       # Format src/ with oxfmt

# Type checking
bun run type-check   # vue-tsc type validation
```

**Package manager:** `bun` (bun.lock present)

## Architecture

**Stack:** Vue 3.5 (beta) + TypeScript + Vite (beta) + Vue Router v5 + Pinia v3

**Entry point chain:** `index.html` → `src/main.ts` → creates Vue app with Pinia + Router → mounts to `#app`

**Routing:** `src/router/index.ts` — web history mode. HomeView is eager-loaded; AboutView is lazy-loaded (code splitting).

**State:** Pinia stores in `src/stores/` use the composition API style (`defineStore` with `setup` function returning refs/computed/actions).

**Component structure:**
- `src/views/` — page-level components rendered by RouterView
- `src/components/` — reusable components
- `src/components/__tests__/` — Vitest unit tests co-located with components
- `e2e/` — Playwright E2E tests

**Path alias:** `@/` maps to `src/` (configured in both Vite and tsconfig).

**Linting:** Two-layer linting — Oxlint (fast Rust-based, runs first) then ESLint. Config files: `.oxlintrc.json` and `eslint.config.ts`.

**TypeScript:** Multiple tsconfig files — `tsconfig.app.json` (app code), `tsconfig.node.json` (build tools), `tsconfig.vitest.json` (tests). `noUncheckedIndexedAccess` is enabled.
