import { fileURLToPath, URL } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { dirname, join } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/node_modules",
];

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*")].concat(PYODIDE_EXCLUDE),
        dest: "assets",
      },
    ],
  });
}

export function viteStaticCopyAssets() {
  return viteStaticCopy({
    targets: [
      { src: "deps/z80asm/z80asm.py", dest: "assets" },
      { src: "deps/z80e/build/z80e.wasm", dest: "assets" },
      { src: "src/assets/script.py", dest: "assets" }
    ]
  })
}

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ["pyodide"]
  },
  plugins: [
    vue(),
    vueDevTools(),
    viteStaticCopyPyodide(),
    viteStaticCopyAssets()
  ],
  define: {
    __Z80ASM_FILE__: JSON.stringify("/assets/z80asm.py"),
    __SCRIPT_FILE__: JSON.stringify("/assets/script.py"),
    __Z80E_WASM_FILE__: JSON.stringify("/assets/z80e.wasm")
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  worker: {
    format: "es"
  },
})
