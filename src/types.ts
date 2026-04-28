export type ProjectType = 'nodejs' | 'python' | 'go' | 'rust' | 'java' | 'unknown'

export interface FileInfo {
  relativePath: string
  extension: string
  sizeBytes: number
}

export type DependencyGraph = Record<string, string[]>

export interface ProjectScan {
  name: string
  path: string
  type: ProjectType
  files: FileInfo[]
  testFiles: string[]
  tree: string
  dependencies: DependencyGraph
  packageInfo?: Record<string, unknown>
  fileContents?: Record<string, string>
}

export interface ProjectInfo {
  name: string
  type: string
  summary: string
  techStack: string[]
}

export type TechCategory = 'framework' | 'database' | 'cache' | 'messaging' | 'app' | 'external'

export interface TechNode {
  id: string
  name: string
  category: TechCategory
  version?: string
  description: string
  health: 'good' | 'warning' | 'critical'
  issues?: string[]
  suggestions?: string[]
}

export interface TechIntegration {
  id: string
  source: string
  target: string
  description: string
  protocol?: string
}

export interface MacroView {
  summary: string
  nodes: TechNode[]
  integrations: TechIntegration[]
}

export interface Module {
  id: string
  name: string
  path: string
  description: string
  responsibilities: string[]
  dependencies: string[]
  health: 'good' | 'warning' | 'critical'
  issues?: string[]
  suggestions?: string[]
  isNew?: boolean
  relatedTechIds?: string[]
  diffStatus?: 'added' | 'removed' | 'changed' | 'unchanged'
}

export interface Change {
  id: string
  type: 'split' | 'merge' | 'move' | 'create' | 'remove' | 'rename' | 'refactor'
  description: string
  reason: string
  impact: 'low' | 'medium' | 'high'
  affectedModules: string[]
}

export interface ArchitectureView {
  summary: string
  modules: Module[]
}

export interface SuggestedView extends ArchitectureView {
  changes: Change[]
}

export type AntiPatternName =
  | 'god-class'
  | 'feature-envy'
  | 'shotgun-surgery'
  | 'data-clump'
  | 'dead-code'
  | 'primitive-obsession'

export interface AntiPattern {
  id: string
  name: AntiPatternName
  moduleId: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface ModuleScore {
  moduleId: string
  score: number
  cohesion: number
  coupling: number
  size: number
  rationale: string
}

export interface TestCoverage {
  testFilesFound: number
  coveredModules: string[]
  uncoveredModules: string[]
  coverageScore: number
  testPriorities: string[]
}

export interface ArchDecision {
  id: string
  title: string
  description: string
  pros: string[]
  cons: string[]
  alternatives?: string[]
}

export interface RoadmapPhase {
  phase: number
  title: string
  duration: string
  description: string
  items: string[]
  modules: string[]
}

export interface ArchlensReport {
  project: ProjectInfo
  macro: MacroView
  current: ArchitectureView
  suggested: SuggestedView
  healthScore: number
  antiPatterns: AntiPattern[]
  moduleScores: ModuleScore[]
  testCoverage: TestCoverage
  decisions?: ArchDecision[]
  roadmap?: RoadmapPhase[]
}
