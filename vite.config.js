import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/epstein-forensic-finance/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        analytics: resolve(__dirname, 'analytics.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
