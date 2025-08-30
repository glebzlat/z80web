import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ["pyodide"]
  },
  plugins: [
    vue(),
    vueDevTools()
  ],
  define: {
    __Z80ASM_FILE__: JSON.stringify("deps/z80asm/z80asm.py")
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
