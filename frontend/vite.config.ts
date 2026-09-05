import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/ws': { target: 'ws://localhost:8088', ws: true, changeOrigin: true },
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
