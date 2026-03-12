/**
 * Global test setup — polyfill browser APIs that jsdom doesn't provide.
 * Referenced via vitest.config.ts → test.setupFiles.
 */

// ── ResizeObserver mock ────────────────────────────────────────────────────────
// Fires the callback immediately on observe() so that components that use
// ResizeObserver internally get their container-height logic exercised.

class MockResizeObserver {
  private readonly cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void

  constructor(cb: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void) {
    this.cb = cb
    // Expose the latest instance so individual tests can trigger custom callbacks
    ;(globalThis as any).__latestResizeObserver = this
  }

  observe(target: Element): void {
    const fakeEntry = {
      contentRect: { height: 400, width: 800 } as DOMRectReadOnly,
      target,
      borderBoxSize: [] as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [] as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as ReadonlyArray<ResizeObserverSize>,
    } as ResizeObserverEntry
    this.cb([fakeEntry], this as unknown as ResizeObserver)
  }

  unobserve(_target: Element): void {}
  disconnect(): void {}

  /** Call in tests to exercise the falsy `if (entry)` branch */
  triggerWithEmpty(): void {
    this.cb([], this as unknown as ResizeObserver)
  }
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
