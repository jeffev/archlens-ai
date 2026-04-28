import fs from 'fs'
import path from 'path'

export type Lang = 'pt' | 'en' | 'es'
export type Profile = 'security' | 'performance' | 'architecture'
export type Depth = 'shallow' | 'deep'

export const SCAN_LIMITS = {
  maxFiles: 200,
  keyFilesMax: 10,
  keyFileMaxBytes: 3000,
} as const

export interface ArchlensConfig {
  ignore?: string[]
  depth?: Depth
  minScore?: number
  lang?: Lang
  profile?: Profile
}

export function loadConfig(projectPath: string): ArchlensConfig {
  const configPath = path.join(projectPath, '.archlens.json')
  if (!fs.existsSync(configPath)) return {}
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as ArchlensConfig
    return parsed
  } catch {
    console.warn('  Aviso: .archlens.json inválido — ignorando configuração do arquivo')
    return {}
  }
}

export function mergeConfig(file: ArchlensConfig, cli: Partial<ArchlensConfig>): ArchlensConfig {
  return {
    ignore: [...(file.ignore ?? []), ...(cli.ignore ?? [])],
    depth: cli.depth ?? file.depth ?? 'shallow',
    minScore: cli.minScore ?? file.minScore,
    lang: cli.lang ?? file.lang ?? 'pt',
    profile: cli.profile ?? file.profile ?? 'architecture',
  }
}
