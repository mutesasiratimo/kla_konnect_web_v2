import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Browser calls same-origin /api/... ; Vite forwards to the API so you avoid CORS during dev.
    proxy: {
      '/api': {
        // target: 'http://109.123.241.160:8041',
        target: 'http://172.16.0.160:32257',
        changeOrigin: true,
      },
    },
  },
})
