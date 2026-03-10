import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [
    react(), // ← remove the babel plugin temporarily
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})