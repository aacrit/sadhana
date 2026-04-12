import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['engine/**/*.test.ts', 'engine/**/*.spec.ts'],
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@/engine': resolve(__dirname, './engine'),
    },
  },
})
