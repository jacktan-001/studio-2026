import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single-origin SPA. All sub-sites are routes within one Vite app,
// which is what guarantees the global audio player never unmounts on navigation.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  preview: { port: 4180, host: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
