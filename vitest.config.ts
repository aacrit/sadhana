import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Vitest config — covers both the engine library and the frontend's
 * pure-logic modules (lesson loader, supabase helpers). Component tests
 * that need a DOM live in *.dom.test.ts files and run under jsdom; pure-
 * logic tests run under node.
 *
 * T3.1 — frontend test harness. The engine has 446 tests; the frontend
 * had zero. We now cover the highest-risk pure-logic surfaces here so
 * lesson loading, persistence, and progression logic have a safety net.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'engine/**/*.test.ts',
      'engine/**/*.spec.ts',
      'frontend/app/**/*.test.ts',
    ],
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@/engine': resolve(__dirname, './engine'),
    },
  },
})
