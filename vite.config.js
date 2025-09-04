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
    __Z80ASM_FILE__: JSON.stringify("/deps/z80asm/z80asm.py"),
    __SCRIPT_FILE__: JSON.stringify("/src/assets/script.py"),
    __Z80E_WASM_FILE__: JSON.stringify("deps/z80e/build/z80e.wasm"),
    __ASSEMBLER_WORKER__: JSON.stringify("src/assemblerWorker.js")
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
