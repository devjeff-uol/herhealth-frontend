import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig(({ mode }) => {
 const env = loadEnv(mode, process.cwd(), '')
 return {
  plugins: [vue()],
  server: { proxy: { '/api': { target: env.HERHEALTH_API_PROXY || 'http://127.0.0.1:8000', changeOrigin: true } } }
 }
})
