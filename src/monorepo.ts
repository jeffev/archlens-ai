import path from 'path'
import fg from 'fast-glob'
import { scan, scanConfigFiles } from './scanner/index.js'
import { analyze } from './analyzer/index.js'
import { render } from './renderer/index.js'
import { renderMonorepoIndex } from './renderer/monorepo.js'
import { createProgressBar } from './utils/progress.js'
import type { ArchlensConfig } from './config.js'
import type { WorkspaceResult } from './renderer/monorepo.js'

const WORKSPACE_MARKERS = [
  'packages/*/package.json',
  'apps/*/package.json',
  'services/*/package.json',
  'packages/*/pyproject.toml',
  'apps/*/pyproject.toml',
  'services/*/pyproject.toml',
  'packages/*/pom.xml',
  'services/*/pom.xml',
  'packages/*/go.mod',
  'services/*/go.mod',
]

export async function detectWorkspaces(rootPath: string): Promise<string[]> {
  const matches = await fg(WORKSPACE_MARKERS, {
    cwd: rootPath,
    onlyFiles: true,
    ignore: ['**/node_modules/**'],
  })

  const dirs = new Set(matches.map(m => path.dirname(m)))
  return [...dirs].sort().map(d => path.join(rootPath, d))
}

export async function analyzeMonorepo(
  rootPath: string,
  config: ArchlensConfig,
  outputPath: string,
): Promise<void> {
  const workspacePaths = await detectWorkspaces(rootPath)

  if (workspacePaths.length === 0) {
    throw new Error(
      'Nenhum workspace detectado. Esperado: packages/*, apps/*, ou services/*\n' +
      'Verifique se o diretório contém um monorepo válido ou rode sem --monorepo.',
    )
  }

  console.log(`\n  Workspaces detectados: ${workspacePaths.map(p => path.basename(p)).join(', ')}\n`)

  const outputDir = path.dirname(outputPath)
  const results: WorkspaceResult[] = []

  for (const wsPath of workspacePaths) {
    const name = path.basename(wsPath)
    console.log(`  ── Workspace: ${name}`)

    let bar: ReturnType<typeof createProgressBar> | null = null
    const projectScan = await scan(wsPath, config, (current, total) => {
      if (!bar) bar = createProgressBar('     Estrutura...', total)
      bar.tick()
    })
    if (bar) {
      bar.done(`     Estrutura... ${projectScan.files.length} arquivos`)
    } else {
      console.log(`     ${projectScan.files.length} arquivos`)
    }

    const configs = await scanConfigFiles(wsPath)
    const report = await analyze(projectScan, configs, config)

    console.log(`     Health score: ${report.healthScore}/100`)

    const reportFile = `archlens-report-${name}.html`
    const reportPath = path.join(outputDir, reportFile)
    render(report, reportPath)
    console.log(`     Relatório: ${reportPath}`)

    results.push({ name, reportFile, report })
  }

  renderMonorepoIndex(results, outputPath)

  const avg = Math.round(results.reduce((s, w) => s + w.report.healthScore, 0) / results.length)
  console.log(`\n  Health score médio: ${avg}/100`)
  console.log(`  Índice consolidado: ${outputPath}\n`)
}
