import type { ArchlensReport } from '../types.js'
import type { Lang } from '../config.js'

const LANG_NAME: Record<Lang, string> = {
  pt: 'Brazilian Portuguese (pt-BR)',
  en: 'English',
  es: 'Spanish',
}

const SCHEMA_EXAMPLE: ArchlensReport = {
  project: {
    name: 'ride-hailing-platform',
    type: 'System Design',
    summary: 'Real-time ride-hailing platform connecting passengers and drivers with dynamic pricing',
    techStack: ['Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'WebSocket'],
  },
  macro: {
    summary: 'Event-driven microservices with real-time communication via WebSocket and async processing via Kafka',
    nodes: [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        category: 'app',
        description: 'Single entry point — routes requests, handles auth, rate limiting',
        health: 'good',
        suggestions: ['Add circuit breaker per downstream service'],
      },
      {
        id: 'postgres',
        name: 'PostgreSQL',
        category: 'database',
        description: 'Primary store for users, drivers, trips, payments',
        health: 'good',
        suggestions: ['Partition trips table by month for time-series queries'],
      },
      {
        id: 'redis',
        name: 'Redis',
        category: 'cache',
        description: 'Driver locations (Geo commands), active sessions, surge pricing state',
        health: 'good',
        issues: ['Define TTL for location keys to avoid stale data'],
      },
      {
        id: 'kafka',
        name: 'Apache Kafka',
        category: 'messaging',
        description: 'Event bus: trip lifecycle events, payment events, driver availability',
        health: 'good',
        suggestions: ['Define DLQ per topic from day one'],
      },
      {
        id: 'websocket-server',
        name: 'WebSocket Server',
        category: 'app',
        description: 'Real-time driver location updates and trip status push to clients',
        health: 'good',
      },
    ],
    integrations: [
      { id: 'gw-trip', source: 'api-gateway', target: 'trip-service', description: 'Trip requests', protocol: 'HTTP' },
      { id: 'trip-pg', source: 'trip-service', target: 'postgres', description: 'Trip persistence', protocol: 'JDBC' },
      { id: 'trip-kafka', source: 'trip-service', target: 'kafka', description: 'Trip events', protocol: 'AMQP' },
      { id: 'driver-redis', source: 'driver-service', target: 'redis', description: 'Location tracking', protocol: 'Redis Protocol' },
      { id: 'ws-redis', source: 'websocket-server', target: 'redis', description: 'Sub/pub for location', protocol: 'Redis Protocol' },
    ],
  },
  current: {
    summary: 'Common naive starting point: single service handling all responsibilities, no async processing',
    modules: [
      {
        id: 'monolith',
        name: 'Monolith Service',
        path: 'src/',
        description: 'Single service handling users, drivers, trips, pricing and notifications',
        responsibilities: ['user auth', 'driver matching', 'trip management', 'pricing calculation', 'push notifications'],
        dependencies: [],
        health: 'critical',
        issues: [
          'No separation of concerns — driver matching blocks the HTTP thread',
          'Pricing calculation coupled directly to trip creation',
          'No async processing — notification delivery blocks response',
          'Single database connection pool shared by all features',
        ],
        relatedTechIds: ['postgres'],
      },
    ],
  },
  suggested: {
    summary: 'Domain-driven decomposition with async event processing and dedicated real-time layer',
    modules: [
      {
        id: 'trip-service',
        name: 'Trip Service',
        path: 'services/trip/',
        description: 'Owns trip lifecycle: creation, status transitions, completion',
        responsibilities: ['create trip', 'accept/reject by driver', 'complete trip', 'emit TripCreated/Completed events'],
        dependencies: ['pricing-service'],
        health: 'good',
        isNew: true,
        relatedTechIds: ['postgres', 'kafka'],
      },
      {
        id: 'driver-service',
        name: 'Driver Service',
        path: 'services/driver/',
        description: 'Driver availability, location tracking, matching algorithm',
        responsibilities: ['track driver GPS', 'find nearest available driver', 'driver availability toggle'],
        dependencies: [],
        health: 'good',
        isNew: true,
        relatedTechIds: ['redis', 'kafka'],
      },
      {
        id: 'pricing-service',
        name: 'Pricing Service',
        path: 'services/pricing/',
        description: 'Dynamic surge pricing calculation, isolated and independently scalable',
        responsibilities: ['calculate base fare', 'apply surge multiplier', 'estimate ETA pricing'],
        dependencies: [],
        health: 'good',
        isNew: true,
        relatedTechIds: ['redis'],
      },
      {
        id: 'notification-service',
        name: 'Notification Service',
        path: 'services/notification/',
        description: 'Async consumer of Kafka events — sends push, SMS, email without blocking trip flow',
        responsibilities: ['push notifications', 'SMS via Twilio', 'email receipts'],
        dependencies: [],
        health: 'good',
        isNew: true,
        relatedTechIds: ['kafka'],
      },
    ],
    changes: [
      {
        id: 'c1',
        type: 'split',
        description: 'Extract Trip Service from monolith',
        reason: 'Trips are the core domain — isolating them allows independent scaling during peak hours',
        impact: 'high',
        affectedModules: ['monolith', 'trip-service'],
      },
      {
        id: 'c2',
        type: 'create',
        description: 'Create dedicated Driver Service with Redis Geo for location',
        reason: 'Driver matching is latency-critical and requires specialized data structures (Redis GEORADIUS)',
        impact: 'high',
        affectedModules: ['driver-service'],
      },
      {
        id: 'c3',
        type: 'create',
        description: 'Async Notification Service consuming Kafka TripCompleted events',
        reason: 'Notifications must never block trip creation — decoupling via Kafka adds resilience',
        impact: 'medium',
        affectedModules: ['notification-service'],
      },
    ],
  },
  healthScore: 87,
  decisions: [
    {
      id: 'dec-1',
      title: 'Kafka over RabbitMQ',
      description: 'Chosen Kafka as the event bus because trip lifecycle events must be replayable and ordered per trip.',
      pros: ['Event replay for audit', 'Log compaction for driver state', 'High throughput at scale'],
      cons: ['Heavier ops than RabbitMQ', 'Requires ZooKeeper/KRaft', 'Steeper learning curve'],
      alternatives: ['RabbitMQ (simpler but no replay)', 'Redis Streams (good for smaller scale)'],
    },
    {
      id: 'dec-2',
      title: 'Separate Pricing Service',
      description: 'Extracted surge pricing into its own service so it can scale independently during demand spikes without affecting trip creation latency.',
      pros: ['Independent scaling', 'Easy A/B testing of pricing algorithms', 'Isolated failure domain'],
      cons: ['Extra network hop on trip creation', 'Needs circuit breaker if pricing service is down'],
      alternatives: ['Inline pricing in Trip Service (simpler but couples concerns)'],
    },
  ],
  roadmap: [
    {
      phase: 1,
      title: 'Core Trip Flow',
      duration: '2–3 weeks',
      description: 'Stand up the minimum viable event-driven pipeline: ingest trip requests and process them asynchronously.',
      items: ['Deploy Trip Service with Postgres', 'Set up Kafka with trip-events topic', 'Basic Driver Service with Redis Geo'],
      modules: ['trip-service', 'driver-service'],
    },
    {
      phase: 2,
      title: 'Pricing & Notifications',
      duration: '1–2 weeks',
      description: 'Add dynamic pricing and decouple notifications so they never block trip creation.',
      items: ['Pricing Service with Redis state', 'Notification Service consuming TripCompleted', 'Wire WebSocket push'],
      modules: ['pricing-service', 'notification-service'],
    },
    {
      phase: 3,
      title: 'Resilience & Observability',
      duration: '1 week',
      description: 'Harden the system for production: circuit breakers, DLQs, and distributed tracing.',
      items: ['Add circuit breaker in API Gateway', 'DLQ per Kafka topic', 'OpenTelemetry tracing across services'],
      modules: [],
    },
  ],
}

export function buildSuggestPrompt(description: string, lang: Lang = 'pt'): string {
  const langName = LANG_NAME[lang]
  return `You are a world-class software architect. A user has described a problem and wants you to design a complete, production-ready architecture for it.

## User Problem:
${description}

## Your task:
Design a complete architecture with two views:
1. **current** — the naive/default approach most teams start with (monolith, no separation, no async). Make this realistic but flawed so the contrast is instructive.
2. **suggested** — your recommended architecture with proper separation of concerns, right technology choices, and scalability in mind.

## Rules:
- Choose realistic technology stacks appropriate for the problem (don't over-engineer)
- The macro nodes should reflect the actual system components needed (DBs, caches, queues, external APIs, services)
- Each module should have clear, non-overlapping responsibilities
- Changes should explain WHY — architectural reasoning, not just what to do
- healthScore should be 82-92 (clean design from scratch, room for future improvements)
- Write ALL descriptive text values in ${langName} (summaries, descriptions, reasons, items, titles, rationale — everything except IDs)
- Module ids and tech ids must use kebab-case with no spaces (regardless of language)
- Keep module paths realistic (e.g. "services/order/", "src/payment/", "cmd/worker/")
- **CRITICAL**: Every module's "dependencies" field MUST list the exact IDs of ALL other modules it calls or reads from. An ERP with 5+ services should have many inter-service dependencies — leaving most as [] is wrong. Example: order-service depends on inventory-service and financial-service; fulfillment-service depends on order-service and notification-service. Think through the full call graph before writing.
- **CRITICAL**: macro.integrations source and target values MUST exactly match the "id" values of nodes defined in macro.nodes. Never reference an id that is not in the nodes list.
- Generate 2–4 "decisions" entries explaining the key architectural choices (technology picks, service boundaries) with honest pros/cons.
- Generate 3–4 "roadmap" phases with concrete implementation steps, realistic durations, and which module IDs are delivered per phase.

## CRITICAL: Return ONLY valid JSON in EXACTLY this schema. No markdown, no explanation, no text before or after:

${JSON.stringify(SCHEMA_EXAMPLE, null, 2)}`
}
