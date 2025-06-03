import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173, // Explicitly set port if needed
    proxy: {
      // Proxy API requests to the backend server during development
      '/api': {
        target: 'http://localhost:5001', // Your backend server URL
        changeOrigin: true, // Recommended
        secure: false,      // Optional: if backend uses self-signed SSL cert
      }
    }
  }
}) 