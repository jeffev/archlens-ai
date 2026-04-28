# archlens-ai

[![npm](https://img.shields.io/npm/v/archlens-ai?color=6366f1&label=npm)](https://www.npmjs.com/package/archlens-ai)
[![node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![powered by](https://img.shields.io/badge/powered%20by-Claude%20Code-6366f1)](https://claude.ai/code)

Interactive architecture visualization powered by Claude Code. Point it at any codebase and get a self-contained HTML report with an interactive graph, health scores, anti-pattern detection, dependency cycles, and refactoring suggestions — in seconds.

```bash
npx archlens-ai analyze ./my-project
```

---

## Features

| | |
|---|---|
| **Macro diagram** | Interactive tech stack graph — frameworks, databases, caches, brokers grouped in enterprise-style containers with protocol-colored edges |
| **Module map** | Logical modules extracted from your source tree with health scores, responsibilities, and inter-module dependencies |
| **Suggested architecture** | Concrete refactoring proposals (split, merge, create, remove) with type, reason, and impact level |
| **Anti-pattern detection** | God Class, Feature Envy, Shotgun Surgery, Data Clump, Dead Code, Primitive Obsession — with severity and affected module |
| **Module scores** | 0–100 breakdown per module: cohesion, coupling, size — sorted worst-first |
| **Test coverage** | Correlates test files with modules, scores coverage, ranks untested modules by risk |
| **Circular dependencies** | DFS cycle detection with visual highlighting and a how-to-fix guide |
| **Greenfield mode** | Describe a problem → get a full architecture proposal, architectural decisions, and implementation roadmap — no existing code needed |
| **Monorepo support** | Detects workspaces under `packages/`, `apps/`, `services/` and generates a consolidated index dashboard |
| **CI quality gate** | `--min-score <n>` exits with code 1 when health score is below threshold |

---

## Requirements

- **[Claude Code](https://claude.ai/code)** — installed and authenticated (`claude` available in your PATH)
- **Node.js 18+**

---

## Install

```bash
npm install -g archlens-ai
```

Or run without installing:

```bash
npx archlens-ai analyze ./my-project
```

---

## Quick start

```bash
# Analyze an existing project
archlens-ai analyze ./my-project

# Analyze current directory
archlens-ai analyze

# Generate architecture from a description (no code needed)
archlens-ai suggest "multi-tenant SaaS for invoice management with Stripe billing and PDF generation"

# Generate in English
archlens-ai suggest "ride-hailing platform" --lang en

# Analyze monorepo
archlens-ai analyze ./my-monorepo --monorepo
```

Reports are saved to `~/archlens-reports/` by default and opened automatically in your browser.

---

## Commands

### `analyze [path]`

Analyze an existing codebase.

```bash
archlens-ai analyze ./my-project
archlens-ai analyze                         # current directory
archlens-ai ./my-project                    # shorthand (default command)
```

**Output tabs:** Sistema · Estado Atual · Sugerido · Diff · Ciclos · Qualidade

### `suggest <description>`

Generate a complete architecture proposal from a plain-text description. No existing code needed.

```bash
archlens-ai suggest "e-commerce platform with inventory management and real-time notifications"
archlens-ai suggest "ERP system with HR, finance, and procurement modules" --lang en
```

**Output tabs:** Sistema · Estado Atual · Sugerido · Diff · Decisões · Roadmap

---

## Options

### `analyze` options

| Flag | Default | Description |
|---|---|---|
| `-o, --output <file>` | `~/archlens-reports/<project>.html` | Custom output path |
| `--no-open` | — | Don't open browser automatically |
| `--lang pt\|en\|es` | `pt` | Language for AI-generated content |
| `--profile architecture\|security\|performance` | `architecture` | Analysis focus |
| `--depth shallow\|deep` | `shallow` | Deep mode reads key file contents |
| `--min-score <n>` | — | Exit code 1 if health score is below threshold |
| `--monorepo` | — | Detect and analyze workspaces |

### `suggest` options

| Flag | Default | Description |
|---|---|---|
| `-o, --output <file>` | `~/archlens-reports/suggest-<slug>.html` | Custom output path |
| `--no-open` | — | Don't open browser automatically |
| `--lang pt\|en\|es` | `pt` | Language for generated content |

### Analysis profiles

**`--profile architecture`** (default) — module cohesion, coupling, dependency structure, refactoring suggestions.

**`--profile security`** — OWASP Top 10: auth gaps, injection risks, exposed secrets, missing rate limiting, vulnerable dependencies.

**`--profile performance`** — N+1 queries, missing pagination, sync blocking I/O, caching opportunities, missing indexes.

---

## Config file

Create `.archlens.json` at the root of your project to set permanent defaults. CLI flags always take precedence.

```json
{
  "ignore": ["dist", "coverage", "storybook-static"],
  "depth": "deep",
  "lang": "en",
  "profile": "architecture",
  "minScore": 60
}
```

---

## CI / Quality gate

Block merges when architecture quality drops:

```yaml
# .github/workflows/archlens.yml
- name: Architecture quality gate
  run: npx archlens-ai analyze . --min-score 70 --no-open --output /tmp/archlens.html
```

Exit code 1 is returned when `healthScore < minScore`, making it a blocking CI check.

---

## Report tabs

| Tab | Mode | Description |
|---|---|---|
| **Sistema** | both | Tech stack graph — click a node for issues, suggestions, and related modules |
| **Estado Atual** | both | Current module map with health, responsibilities, dependencies, scores |
| **Sugerido** | both | Proposed architecture with diff status (added/changed/removed) per module |
| **Diff** | both | Change cards — type, impact, reason, and affected modules |
| **Ciclos** | analyze | Circular dependency detection with highlighted cycle paths |
| **Qualidade** | analyze | Anti-patterns, module score ranking, test coverage priorities |
| **Decisões** | suggest | Architectural decision records with honest pros/cons and alternatives |
| **Roadmap** | suggest | Phased implementation plan with realistic durations |

---

## How it works

```
your project
     │
     ▼
 1. Scan           fast-glob walks the tree, builds import graph,
                   reads package.json / docker-compose / app config
     │
     ▼
 2. Macro prompt   Claude Code → tech stack, per-node issues & suggestions
     │
     ▼
 3. Micro prompt   Claude Code → modules, scores, anti-patterns, refactoring
     │
     ▼
 4. Render         self-contained HTML report (Cytoscape.js embedded)
```

Both Claude calls run sequentially. Total time is typically 15–60 seconds depending on project size and model response time.

---

## Supported languages

| Extension | Detected as |
|---|---|
| `.ts` `.tsx` `.js` `.jsx` | Node.js |
| `.py` | Python |
| `.go` | Go |
| `.rs` | Rust |
| `.java` `.kt` | Java / Kotlin |

---

## License

MIT © [Jefferson Valandro](https://github.com/jeffev)
