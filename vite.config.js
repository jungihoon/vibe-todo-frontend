import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/todos': {
        target: 'https://vibe-todo-backend-vn21.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
