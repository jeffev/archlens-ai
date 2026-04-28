import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import type { ArchlensReport } from '../types.js'
import { generateHTML } from './template.js'

const require = createRequire(import.meta.url)

function getCytoscapeJs(): string {
  try {
    const cytoscapePkg = require.resolve('cytoscape/dist/cytoscape.min.js')
    return fs.readFileSync(cytoscapePkg, 'utf-8')
  } catch {
    // fallback to CDN if local copy not found
    return ''
  }
}

export function render(report: ArchlensReport, outputPath: string): void {
  const cytoscapeJs = getCytoscapeJs()
  const html = generateHTML(report, cytoscapeJs)
  fs.writeFileSync(outputPath, html, 'utf-8')
}
