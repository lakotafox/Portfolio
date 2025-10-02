import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't delete existing files
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
