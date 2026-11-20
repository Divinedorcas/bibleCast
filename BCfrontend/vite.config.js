import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'silence-rolldown-jsx-warning',
      config(config) {
        // Removes unrecognized 'jsx' key passed by @vitejs/plugin-react to Rolldown optimizer
        if (config.optimizeDeps?.rollupOptions?.jsx) {
          delete config.optimizeDeps.rollupOptions.jsx;
        }
      },
      configResolved(config) {
        if (config.optimizeDeps?.rollupOptions?.jsx) {
          delete config.optimizeDeps.rollupOptions.jsx;
        }
      },
    },
  ],
})
