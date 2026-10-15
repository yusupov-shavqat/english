import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // `php artisan serve` handles one request at a time on Windows, so speech audio
      // gets its own server (port 8001) and can play while a turn is still streaming.
      '/api/speech': 'http://127.0.0.1:8001',
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
