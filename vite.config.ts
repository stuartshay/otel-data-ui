import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet', 'react-leaflet'],
          apollo: ['@apollo/client', 'graphql'],
          recharts: ['recharts'],
        },
      },
    },
  },
  ...(command === 'build' && {
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log', 'console.debug', 'console.info', 'console.warn'],
    },
  }),
}))
