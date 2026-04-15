import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "")
  const target = env.VITE_DEV_PROXY_TARGET || "http://localhost:8000"

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
        },
        "/health": {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
