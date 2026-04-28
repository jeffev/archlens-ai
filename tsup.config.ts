import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
  clean: true,
  define: {
    __PKG_VERSION__: JSON.stringify(version),
  },
})
