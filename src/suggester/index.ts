import type { ArchlensReport } from '../types.js'
import type { Lang } from '../config.js'
import { buildSuggestPrompt } from './prompt.js'
import { safeParseReport } from '../analyzer/schemas.js'
import { runClaude } from '../utils/runClaude.js'
import { extractJson } from '../utils/json.js'

export async function suggest(description: string, lang: Lang = 'pt'): Promise<ArchlensReport> {
  process.stdout.write('  Consultando Claude Code')
  const output = await runClaude(buildSuggestPrompt(description, lang))
  const report = safeParseReport(extractJson(output))
  console.log(` → ${report.macro.nodes.length} tecnologias, ${report.suggested.modules.length} módulos`)
  return report
}
