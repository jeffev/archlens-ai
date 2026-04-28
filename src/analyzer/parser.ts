import type { ArchlensReport, MacroView } from '../types.js'
import { safeParseMacro, safeParseMicro } from './schemas.js'
import { extractJson } from '../utils/json.js'

export function parseMacroResponse(output: string): MacroView {
  return safeParseMacro(extractJson(output))
}

export function parseMicroResponse(output: string): Omit<ArchlensReport, 'macro'> {
  return safeParseMicro(extractJson(output))
}
