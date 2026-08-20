import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind mount Docker (macOS) : les événements fs natifs ne remontent pas au conteneur,
    // il faut donc du polling pour que le HMR détecte les changements de fichiers.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
