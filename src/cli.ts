import { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { scan, scanConfigFiles } from './scanner/index.js'
import { analyze } from './analyzer/index.js'
import { suggest } from './suggester/index.js'
import { analyzeMonorepo } from './monorepo.js'
import { render } from './renderer/index.js'
import { loadConfig, mergeConfig } from './config.js'
import { createProgressBar } from './utils/progress.js'
import type { Lang, Profile, Depth } from './config.js'

declare const __PKG_VERSION__: string

const program = new Command()

program
  .name('archlens-ai')
  .description('Interactive architecture visualization powered by Claude Code')
  .version(__PKG_VERSION__)

function reportsDir(): string {
  const dir = path.join(os.homedir(), 'archlens-reports')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function hintForError(msg: string): string {
  if (msg.includes('Timeout') || msg.includes('timeout'))
    return 'Dica: tente rodar novamente ou reduza o escopo com --depth shallow'
  if (msg.includes('JSON') || msg.includes('Resposta inválida') || msg.includes('JSON inválido'))
    return 'Dica: Claude retornou dados inesperados. Execute o mesmo comando novamente.'
  if (msg.includes('Could not run') || msg.includes('claude exited'))
    return 'Dica: verifique se o claude CLI está instalado: npm install -g @anthropic-ai/claude-code'
  return ''
}

// ── analyze (default command) ────────────────────────────────────────────────
program
  .command('analyze [path]', { isDefault: true })
  .description('Analyze an existing project and generate architecture report')
  .option('-o, --output <file>', 'Output HTML file path (default: ~/archlens-reports/<project>.html)')
  .option('--no-open', 'Do not open browser automatically')
  .option('--lang <lang>', 'Report language: pt | en | es')
  .option('--profile <profile>', 'Analysis focus: architecture | security | performance')
  .option('--depth <depth>', 'Analysis depth: shallow | deep')
  .option('--min-score <n>', 'Exit with code 1 if health score is below this threshold', parseInt)
  .option('--monorepo', 'Detect and analyze workspaces (packages/, apps/, services/)')
  .action(async (projectPath: string = '.', options) => {
    const absolutePath = path.resolve(projectPath)

    if (!fs.existsSync(absolutePath)) {
      console.error(`\n  Erro: caminho não encontrado: ${absolutePath}\n`)
      process.exit(1)
    }

    const fileConfig = loadConfig(absolutePath)
    const config = mergeConfig(fileConfig, {
      lang: options.lang as Lang | undefined,
      profile: options.profile as Profile | undefined,
      depth: options.depth as Depth | undefined,
      minScore: options.minScore as number | undefined,
    })

    const profileLabel = config.profile !== 'architecture' ? ` [${config.profile}]` : ''
    const depthLabel = config.depth === 'deep' ? ' [deep]' : ''
    const langLabel = config.lang !== 'pt' ? ` [${config.lang}]` : ''
    console.log(`\n  archlens-ai — ${absolutePath}${profileLabel}${depthLabel}${langLabel}\n`)

    try {
      if (options.monorepo) {
        const outputPath = options.output
          ? path.resolve(options.output)
          : path.join(reportsDir(), 'monorepo.html')
        await analyzeMonorepo(absolutePath, config, outputPath)
        if (options.open) {
          const { default: open } = await import('open')
          await open(outputPath)
        }
        return
      }

      let bar: ReturnType<typeof createProgressBar> | null = null
      const projectScan = await scan(absolutePath, config, (current, total) => {
        if (!bar) bar = createProgressBar('Lendo estrutura do projeto...', total)
        bar.tick()
      })
      const deepInfo = config.depth === 'deep'
        ? ` (${Object.keys(projectScan.fileContents ?? {}).length} arquivos lidos)`
        : ''
      if (bar) {
        bar.done(`Lendo estrutura do projeto... ${projectScan.files.length} arquivos${deepInfo}`)
      } else {
        console.log(`  Lendo estrutura do projeto... ${projectScan.files.length} arquivos${deepInfo}`)
      }

      process.stdout.write('  Lendo arquivos de configuração...')
      const configs = await scanConfigFiles(absolutePath)
      const configCount = [configs.dependencies, configs.appConfig, configs.dockerCompose, configs.dockerfile]
        .filter(Boolean).length
      console.log(` ${configCount} encontrados, ${configs.detectedPatterns.length} padrões detectados`)

      console.log('  Chamando Claude Code (2 fases)...')
      const report = await analyze(projectScan, configs, config)

      console.log(`  → ${report.suggested.changes.length} sugestões de melhoria`)
      console.log(`  → Health score: ${report.healthScore}/100`)

      const outputPath = options.output
        ? path.resolve(options.output)
        : path.join(reportsDir(), `${projectScan.name || 'report'}.html`)

      if (config.minScore !== undefined && report.healthScore < config.minScore) {
        console.error(`\n  Health score ${report.healthScore} está abaixo do mínimo configurado (${config.minScore})\n`)
        render(report, outputPath)
        process.exit(1)
      }

      process.stdout.write('  Gerando relatório HTML...')
      render(report, outputPath)
      console.log(' pronto')

      if (options.open) {
        const { default: open } = await import('open')
        await open(outputPath)
      }

      console.log(`\n  Relatório: ${outputPath}\n`)
    } catch (err) {
      const msg = (err as Error).message
      console.error(`\n  Erro: ${msg}\n`)
      const hint = hintForError(msg)
      if (hint) console.error(`  ${hint}\n`)
      process.exit(1)
    }
  })

// ── suggest ──────────────────────────────────────────────────────────────────
program
  .command('suggest <description>')
  .description('Generate an architecture proposal from a problem description')
  .option('-o, --output <file>', 'Output HTML file path (default: ~/archlens-reports/suggest-<slug>.html)')
  .option('--no-open', 'Do not open browser automatically')
  .option('--lang <lang>', 'Report language: pt | en | es', 'pt')
  .action(async (description: string, options) => {
    const lang = options.lang as Lang
    console.log(`\n  archlens-ai — Suggest [${lang}]\n`)
    console.log(`  Problema: "${description}"\n`)

    try {
      const report = await suggest(description, lang)

      console.log(`  → Health score: ${report.healthScore}/100`)

      const slug = description.slice(0, 40).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
      const outputPath = options.output
        ? path.resolve(options.output)
        : path.join(reportsDir(), `suggest-${slug}.html`)

      process.stdout.write('  Gerando relatório HTML...')
      render(report, outputPath)
      console.log(' pronto')

      if (options.open) {
        const { default: open } = await import('open')
        await open(outputPath)
      }

      console.log(`\n  Relatório: ${outputPath}\n`)
    } catch (err) {
      const msg = (err as Error).message
      console.error(`\n  Erro: ${msg}\n`)
      const hint = hintForError(msg)
      if (hint) console.error(`  ${hint}\n`)
      process.exit(1)
    }
  })

program.parse()
