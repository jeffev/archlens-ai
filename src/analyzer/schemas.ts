import { z } from 'zod'

const TechNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['framework', 'database', 'cache', 'messaging', 'app', 'external']).catch('external'),
  version: z.string().optional(),
  description: z.string(),
  health: z.enum(['good', 'warning', 'critical']).catch('warning'),
  issues: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
})

const TechIntegrationSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  description: z.string(),
  protocol: z.string().optional(),
})

export const MacroViewSchema = z.object({
  summary: z.string(),
  nodes: z.array(TechNodeSchema),
  integrations: z.array(TechIntegrationSchema),
})

const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()),
  dependencies: z.array(z.string()),
  health: z.enum(['good', 'warning', 'critical']).catch('warning'),
  issues: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  isNew: z.boolean().optional(),
  relatedTechIds: z.array(z.string()).optional(),
  diffStatus: z.enum(['added', 'removed', 'changed', 'unchanged']).catch('unchanged').optional(),
})

const ChangeSchema = z.object({
  id: z.string(),
  type: z.enum(['split', 'merge', 'move', 'create', 'remove', 'rename', 'refactor']).catch('refactor'),
  description: z.string(),
  reason: z.string(),
  impact: z.enum(['low', 'medium', 'high']).catch('medium'),
  affectedModules: z.array(z.string()),
})

const ArchitectureViewSchema = z.object({
  summary: z.string(),
  modules: z.array(ModuleSchema),
})

const SuggestedViewSchema = ArchitectureViewSchema.extend({
  changes: z.array(ChangeSchema),
})

const ProjectInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  summary: z.string(),
  techStack: z.array(z.string()),
})

const AntiPatternSchema = z.object({
  id: z.string(),
  name: z.enum(['god-class', 'feature-envy', 'shotgun-surgery', 'data-clump', 'dead-code', 'primitive-obsession']).catch('god-class'),
  moduleId: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']).catch('medium'),
})

const ModuleScoreSchema = z.object({
  moduleId: z.string(),
  score: z.number(),
  cohesion: z.number(),
  coupling: z.number(),
  size: z.number(),
  rationale: z.string(),
})

const TestCoverageSchema = z.object({
  testFilesFound: z.number(),
  coveredModules: z.array(z.string()),
  uncoveredModules: z.array(z.string()),
  coverageScore: z.number(),
  testPriorities: z.array(z.string()),
})

const DEFAULT_TEST_COVERAGE: z.infer<typeof TestCoverageSchema> = {
  testFilesFound: 0,
  coveredModules: [],
  uncoveredModules: [],
  coverageScore: 0,
  testPriorities: [],
}

export const MacroResponseSchema = z.preprocess(
  (val: unknown) => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && 'macro' in (val as object)) {
      return (val as Record<string, unknown>)['macro']
    }
    return val
  },
  MacroViewSchema,
)

export const MicroResponseSchema = z.object({
  project: ProjectInfoSchema,
  current: ArchitectureViewSchema,
  suggested: SuggestedViewSchema,
  healthScore: z.number(),
  antiPatterns: z.array(AntiPatternSchema).optional().default([]),
  moduleScores: z.array(ModuleScoreSchema).optional().default([]),
  testCoverage: TestCoverageSchema.optional().default(DEFAULT_TEST_COVERAGE),
})

const ArchDecisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  alternatives: z.array(z.string()).optional(),
})

const RoadmapPhaseSchema = z.object({
  phase: z.number(),
  title: z.string(),
  duration: z.string(),
  description: z.string(),
  items: z.array(z.string()),
  modules: z.array(z.string()),
})

export const ArchlensReportSchema = MicroResponseSchema.extend({
  macro: MacroViewSchema,
  decisions: z.array(ArchDecisionSchema).optional().default([]),
  roadmap: z.array(RoadmapPhaseSchema).optional().default([]),
})

function formatZodError(err: z.ZodError): string {
  return err.issues
    .slice(0, 5)
    .map(e => `  • ${e.path.join('.')} — ${e.message}`)
    .join('\n')
}

export function safeParseMacro(json: unknown) {
  const result = MacroResponseSchema.safeParse(json)
  if (result.success) return result.data
  throw new Error(`Resposta inválida do Claude (macro):\n${formatZodError(result.error)}`)
}

export function safeParseMicro(json: unknown) {
  const result = MicroResponseSchema.safeParse(json)
  if (result.success) return result.data
  throw new Error(`Resposta inválida do Claude (micro):\n${formatZodError(result.error)}`)
}

export function safeParseReport(json: unknown) {
  const result = ArchlensReportSchema.safeParse(json)
  if (result.success) return result.data
  throw new Error(`Resposta inválida do Claude (suggest):\n${formatZodError(result.error)}`)
}
