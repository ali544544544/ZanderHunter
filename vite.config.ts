/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // WICHTIG: base muss dem GitHub-Repo-Namen entsprechen
  // Das Repo heißt 'ZanderHunter'
  base: process.env.VITE_BASE_URL || '/ZanderHunter/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  }
})
