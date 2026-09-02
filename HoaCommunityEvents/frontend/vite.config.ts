import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7011',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://localhost:7011',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          typeof warning.id === 'string' &&
          warning.id.includes('@microsoft/signalr/dist/esm/Utils.js')
        ) {
          return
        }

        defaultHandler(warning)
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
