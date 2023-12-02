import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    worker: 'src/core/worker.ts',
  },
  format: ['cjs'],
  shims: false,
  dts: false,
  external: [
    'vscode',
  ],
})
