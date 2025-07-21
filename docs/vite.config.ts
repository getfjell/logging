import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/logging/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3004
  }
})
