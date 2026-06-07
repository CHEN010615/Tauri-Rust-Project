import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  clearScreen: false,
  server: {
    strictPort: true,
    port: 1420
  },
  publicDir: 'src/static',
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: runtimeEnv.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !runtimeEnv.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: Boolean(runtimeEnv.TAURI_ENV_DEBUG)
  }
})
