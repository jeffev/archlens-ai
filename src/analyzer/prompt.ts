import type { ProjectScan, TechNode } from '../types.js'
import type { ConfigFiles } from '../scanner/config.js'
import type { Lang, Profile } from '../config.js'

// ── Macro prompt ────────────────────────────────────────────────────────────

const MACRO_SCHEMA_EXAMPLE = {
  macro: {
    summary:
      'Spring Boot monolith connected to Oracle as primary DB, Redis for caching, and Kafka for async event processing',
    nodes: [
      {
        id: 'spring-boot',
        name: 'Spring Boot 3.2',
        category: 'framework',
        version: '3.2.0',
        description: 'Core application framework handling HTTP, security and dependency injection',
        health: 'good',
        issues: [],
        suggestions: ['Consider enabling virtual threads (spring.threads.virtual.enabled=true)'],
      },
      {
        id: 'oracle',
        name: 'Oracle DB 19c',
        category: 'database',
        version: '19c',
        description: 'Primary relational database for all persistent data',
        health: 'warning',
        issues: ['HikariCP max-pool-size not configured — using default of 10'],
        suggestions: [
          'Set spring.datasource.hikari.maximum-pool-size based on expected concurrent load',
          'Add connection-timeout and idle-timeout settings',
        ],
      },
      {
        id: 'redis',
        name: 'Redis',
        category: 'cache',
        version: '7.x',
        description: 'In-memory cache for session and query results',
        health: 'warning',
        issues: ['No TTL or eviction policy configured — risk of memory overflow'],
        suggestions: ['Define TTL per cache region', 'Set maxmemory-policy to allkeys-lru'],
      },
      {
        id: 'kafka',
        name: 'Apache Kafka',
        category: 'messaging',
        version: '3.x',
        description: 'Async event broker for order and notification events',
        health: 'critical',
        issues: ['No Dead Letter Queue (DLQ) configured — failed messages are silently dropped'],
        suggestions: [
          'Configure DLQ for all consumers',
          'Add retries with exponential backoff',
          'Set up consumer group monitoring',
        ],
      },
    ],
    integrations: [
      {
        id: 'boot-oracle',
        source: 'spring-boot',
        target: 'oracle',
        description: 'JPA/Hibernate ORM via connection pool',
        protocol: 'JDBC',
      },
      {
        id: 'boot-redis',
        source: 'spring-boot',
        target: 'redis',
        description: 'Spring Cache abstraction and session storage',
        protocol: 'Redis Protocol',
      },
      {
        id: 'boot-kafka',
        source: 'spring-boot',
        target: 'kafka',
        description: 'Event publishing and consuming via Spring Kafka',
        protocol: 'AMQP',
      },
    ],
  },
}

const PROFILE_INSTRUCTIONS: Record<Profile, string> = {
  architecture: '',
  security: `
## Security Analysis Focus:
Pay special attention to SECURITY concerns:
- Authentication: missing auth middleware, JWT validation gaps, weak session management
- Authorization: endpoints missing permission checks, broken access control, privilege escalation
- Input validation: unvalidated user input, injection risks (SQL, command, LDAP, XSS)
- Sensitive data: logging of passwords/tokens/PII, secrets in source, unencrypted sensitive fields
- Cryptography: MD5/SHA1 usage, weak ciphers, hardcoded keys/salts, insecure random
- Rate limiting: auth endpoints and public APIs without throttling
- Dependency risk: outdated packages with known CVEs
Tag each issue with its OWASP Top 10 category where applicable.`,
  performance: `
## Performance Analysis Focus:
Pay special attention to PERFORMANCE concerns:
- N+1 queries: loops calling the database or external services one-by-one
- Missing pagination: endpoints returning full collections without limits
- Synchronous blocking: I/O or network calls that could be async/parallel
- Caching opportunities: repeated expensive queries or computations without caching
- Implicit missing indexes: query patterns on likely non-indexed columns
- Memory pressure: large object graphs loaded unnecessarily
- Batch opportunities: individual inserts/updates that should be batched`,
}

const LANG_INSTRUCTIONS: Record<Lang, string> = {
  pt: 'Respond in Brazilian Portuguese.',
  en: 'Respond in English.',
  es: 'Respond in Spanish.',
}

export function buildMacroPrompt(scan: ProjectScan, configs: ConfigFiles, profile: Profile = 'architecture', lang: Lang = 'pt'): string {
  const parts: string[] = []

  parts.push(`You are an expert software architect analyzing the TECHNOLOGY ARCHITECTURE of a project.

## Project: ${scan.name} (${scan.type})
## Source files: ${scan.files.length}`)

  if (configs.dependencies) {
    parts.push(`\n## Dependencies / Build File:\n${configs.dependencies}`)
  }

  if (configs.appConfig) {
    parts.push(`\n## Application Configuration:\n${configs.appConfig}`)
  }

  if (configs.dockerCompose) {
    parts.push(`\n## Docker Compose / Infrastructure:\n${configs.dockerCompose}`)
  }

  if (configs.dockerfile) {
    parts.push(`\n## Dockerfile:\n${configs.dockerfile}`)
  }

  if (configs.detectedPatterns.length > 0) {
    parts.push(`\n## Technology Patterns Found in Source Code:\n${configs.detectedPatterns.map(p => `- ${p}`).join('\n')}`)
  }

  if (PROFILE_INSTRUCTIONS[profile]) {
    parts.push(PROFILE_INSTRUCTIONS[profile])
  }

  parts.push(`
## Instructions:
1. Identify all TECHNOLOGY NODES: frameworks, databases, caches, message brokers, external services, cloud services.
2. For each node: describe its role, health (good/warning/critical), actual issues found in the config, and actionable suggestions.
3. Map the INTEGRATIONS between nodes with protocol details.
4. Focus on infrastructure and technology-level concerns, not code structure.
5. Be specific — reference actual config values, versions, and patterns found above.
6. ${LANG_INSTRUCTIONS[lang]}

## CRITICAL: Return ONLY valid JSON in EXACTLY this format, no text before or after:

${JSON.stringify(MACRO_SCHEMA_EXAMPLE, null, 2)}`)

  return parts.join('\n')
}

// ── Micro prompt ────────────────────────────────────────────────────────────

const MICRO_SCHEMA_EXAMPLE = {
  project: {
    name: 'project-name',
    type: 'nodejs',
    summary: 'Brief description of what this project does',
    techStack: ['Spring Boot', 'Oracle', 'Kafka', 'Redis'],
  },
  current: {
    summary: 'Overall assessment of current code architecture',
    modules: [
      {
        id: 'order-service',
        name: 'Order Service',
        path: 'src/main/java/com/app/order',
        description: 'Handles order lifecycle from creation to fulfillment',
        responsibilities: ['order creation', 'order status updates', 'order events publishing'],
        dependencies: ['payment-service', 'inventory-service'],
        health: 'warning',
        issues: ['Contains both business logic and Kafka publishing in the same class'],
        relatedTechIds: ['oracle', 'kafka'],
      },
    ],
  },
  suggested: {
    summary: 'Improvements focus on separating concerns and reducing coupling',
    modules: [
      {
        id: 'order-service',
        name: 'Order Service',
        path: 'src/main/java/com/app/order',
        description: 'Handles only order business logic',
        responsibilities: ['order creation', 'order status updates'],
        dependencies: ['inventory-service'],
        health: 'good',
        isNew: false,
        relatedTechIds: ['oracle'],
        suggestions: ['Delegate event publishing to a dedicated EventPublisher component'],
      },
      {
        id: 'order-events',
        name: 'Order Event Publisher',
        path: 'src/main/java/com/app/order/events',
        description: 'Decoupled event publishing for order domain events',
        responsibilities: ['publish OrderCreated events', 'publish OrderCompleted events'],
        dependencies: ['order-service'],
        health: 'good',
        isNew: true,
        relatedTechIds: ['kafka'],
      },
    ],
    changes: [
      {
        id: 'change-1',
        type: 'split',
        description: 'Extract Kafka event publishing from OrderService into OrderEventPublisher',
        reason:
          'Mixes business logic with infrastructure concerns, making the class hard to test and violating SRP',
        impact: 'medium',
        affectedModules: ['order-service', 'order-events'],
      },
    ],
  },
  healthScore: 58,
  antiPatterns: [
    {
      id: 'ap-1',
      name: 'god-class',
      moduleId: 'order-service',
      description: 'OrderService has 620 lines handling order CRUD, Kafka publishing, email notifications, and PDF generation',
      severity: 'high',
    },
    {
      id: 'ap-2',
      name: 'feature-envy',
      moduleId: 'order-service',
      description: 'OrderService accesses PaymentService.getCustomer() and InventoryService.getStock() directly instead of owning its required data',
      severity: 'medium',
    },
  ],
  moduleScores: [
    {
      moduleId: 'order-service',
      score: 42,
      cohesion: 30,
      coupling: 45,
      size: 55,
      rationale: 'Large class mixing business logic, infrastructure, and presentation concerns; depends on 4 other modules',
    },
    {
      moduleId: 'order-events',
      score: 88,
      cohesion: 95,
      coupling: 85,
      size: 90,
      rationale: 'Single responsibility (event publishing), minimal external dependencies, appropriate size',
    },
  ],
  testCoverage: {
    testFilesFound: 3,
    coveredModules: ['payment-service'],
    uncoveredModules: ['order-service', 'inventory-service', 'order-events'],
    coverageScore: 25,
    testPriorities: ['order-service', 'inventory-service', 'order-events'],
  },
}

export function buildMicroPrompt(scan: ProjectScan, techNodes: TechNode[], profile: Profile = 'architecture', lang: Lang = 'pt'): string {
  const description =
    scan.packageInfo && typeof (scan.packageInfo as Record<string, unknown>).description === 'string'
      ? `## Description: ${(scan.packageInfo as Record<string, string>).description}\n`
      : ''

  const depsText = formatDeps(scan.dependencies)
  const filesText = formatFiles(scan.files)
  const techList = techNodes.map(n => `- ${n.id}: ${n.name} (${n.category})`).join('\n')

  const deepSection = scan.fileContents && Object.keys(scan.fileContents).length > 0
    ? `\n## Key File Contents (deep mode):\n` +
      Object.entries(scan.fileContents)
        .map(([p, c]) => `### ${p}\n\`\`\`\n${c}\n\`\`\``)
        .join('\n\n')
    : ''

  const testSection = scan.testFiles.length > 0
    ? `\n## Test Files Found (${scan.testFiles.length}):\n${scan.testFiles.slice(0, 60).join('\n')}`
    : `\n## Test Files Found: 0 (no test files detected)`

  const profileInstructions = PROFILE_INSTRUCTIONS[profile]

  return `You are an expert software architect. Analyze the CODE ARCHITECTURE of the project below.

## Project: ${scan.name}
## Type: ${scan.type}
${description}
## File Tree:
${scan.tree || '(no source files found)'}

## Import Dependencies:
${depsText || '(dependency graph not available)'}

## Source Files (${scan.files.length} total):
${filesText}
${deepSection}${testSection}

## Technology Nodes identified (use these IDs in relatedTechIds):
${techList || '(none)'}
${profileInstructions}
## Instructions:
1. Identify LOGICAL MODULES — cohesive groups of files implementing a specific business or technical responsibility.
2. For each module in CURRENT architecture: describe it, list responsibilities, inter-module dependencies, health (good/warning/critical), issues.
3. In the 'relatedTechIds' field, list which technology node IDs (from the list above) this module directly uses.
4. Design a SUGGESTED architecture with concrete improvements.
5. For each change: what changes, why, and impact (low/medium/high).
6. Assign overall health score 0-100.
7. Detect ANTI-PATTERNS: god-class (>300 lines with multiple concerns), feature-envy (module constantly accesses other modules' data), shotgun-surgery (one change requires touching many modules), data-clump (same group of data repeated across modules), dead-code (unused modules/classes), primitive-obsession (primitives instead of domain types). Include only patterns actually evidenced by the code structure.
8. Score each module 0-100 with breakdown: cohesion (single responsibility), coupling (independence from others), size (appropriateness). Lower coupling = higher score. Larger size = lower score.
9. For test coverage: use the test files list above to infer which modules have tests. Correlate test file names/paths to module paths. Rank uncovered modules by risk (business-critical first).
10. ${LANG_INSTRUCTIONS[lang]}

## CRITICAL: Return ONLY valid JSON in EXACTLY this format, no text before or after:

${JSON.stringify(MICRO_SCHEMA_EXAMPLE, null, 2)}`
}

function formatDeps(deps: Record<string, string[]>): string {
  const entries = Object.entries(deps).filter(([, v]) => v.length > 0).slice(0, 40)
  if (!entries.length) return ''
  return entries.map(([k, v]) => `${k} → [${v.join(', ')}]`).join('\n')
}

function formatFiles(files: { relativePath: string; sizeBytes: number }[]): string {
  return files
    .slice(0, 60)
    .map(f => `${f.relativePath} (${Math.round(f.sizeBytes / 1024)}kb)`)
    .join('\n')
}
