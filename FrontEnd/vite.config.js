import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // Make `/api/*` calls work in `npm run dev` by proxying to the Express backend.
  // Backend defaults to PORT=3000 in `BackEnd/index.js`.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
