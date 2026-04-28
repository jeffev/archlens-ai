import type { ProjectScan, ArchlensReport } from '../types.js'
import type { ConfigFiles } from '../scanner/config.js'
import type { ArchlensConfig } from '../config.js'
import { buildMacroPrompt, buildMicroPrompt } from './prompt.js'
import { parseMacroResponse, parseMicroResponse } from './parser.js'
import { runClaude } from '../utils/runClaude.js'

export async function analyze(scan: ProjectScan, configs: ConfigFiles, config: ArchlensConfig = {}): Promise<ArchlensReport> {
  const profile = config.profile ?? 'architecture'
  const lang = config.lang ?? 'pt'

  process.stdout.write('  1/2 Analisando arquitetura de sistema')
  const macroOutput = await runClaude(buildMacroPrompt(scan, configs, profile, lang))
  const macro = parseMacroResponse(macroOutput)
  console.log(` → ${macro.nodes.length} tecnologias`)

  process.stdout.write('  2/2 Analisando arquitetura de código')
  const microOutput = await runClaude(buildMicroPrompt(scan, macro.nodes, profile, lang))
  const micro = parseMicroResponse(microOutput)
  console.log(` → ${micro.current.modules.length} módulos`)

  return { ...micro, macro }
}
