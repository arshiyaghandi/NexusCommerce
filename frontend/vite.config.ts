import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/auth/captcha': { target: 'http://localhost:8091', changeOrigin: true },
      '/api/auth/register': { target: 'http://localhost:8091', changeOrigin: true },
      '/api/auth': { target: 'http://localhost:8091', changeOrigin: true },
      '/api/products': { target: 'http://localhost:8085', changeOrigin: true },
      '/api/inventory': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/cart': { target: 'http://localhost:8086', changeOrigin: true },
      '/api/orders': { target: 'http://localhost:8082', changeOrigin: true },
      '/api/finance': { target: 'http://localhost:8089', changeOrigin: true },
      '/api/payments': { target: 'http://localhost:8087', changeOrigin: true },
      '/api/messaging': { target: 'http://localhost:8084', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8088', ws: true, changeOrigin: true },
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
