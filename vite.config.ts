import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || 'http://localhost:5000'
  const port = Number(env.PORT) || 5173

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
