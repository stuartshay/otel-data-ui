import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => ({
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
        // Use Rolldown's `codeSplitting.groups` to keep the same chunking
        // (this superseded `advancedChunks`, which is now deprecated).
        codeSplitting: {
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
}))
