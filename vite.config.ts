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
        // Vite 8 uses Rolldown; the object form of `manualChunks` was removed.
        // Use Rolldown's `advancedChunks.groups` to keep the same chunking.
        advancedChunks: {
          groups: [
            {
              name: 'leaflet',
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
            },
            {
              name: 'apollo',
              test: /[\\/]node_modules[\\/](@apollo\/client|graphql)[\\/]/,
            },
            {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
            },
          ],
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
