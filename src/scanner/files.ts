import fg from 'fast-glob'
import fs from 'fs'
import path from 'path'
import type { FileInfo, ProjectType } from '../types.js'
import { SCAN_LIMITS } from '../config.js'

const BASE_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/out/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/__pycache__/**',
  '**/.venv/**',
  '**/venv/**',
  '**/*.min.js',
  '**/*.d.ts',
  '**/vendor/**',
  '**/*.test.*',
  '**/*.spec.*',
]

const SOURCE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'cs', 'rb', 'kt']

export async function scanFiles(
  projectPath: string,
  extraIgnore: string[] = [],
  onProgress?: (current: number, total: number) => void,
): Promise<FileInfo[]> {
  const patterns = SOURCE_EXTENSIONS.map(ext => `**/*.${ext}`)
  const ignore = [...BASE_IGNORE, ...extraIgnore]

  const filePaths = await fg(patterns, {
    cwd: projectPath,
    ignore,
    onlyFiles: true,
  })

  const sorted = filePaths
    .sort((a, b) => a.split('/').length - b.split('/').length)
    .slice(0, SCAN_LIMITS.maxFiles)

  return sorted.map((rel, i) => {
    const abs = path.join(projectPath, rel)
    const ext = path.extname(rel).slice(1)
    let sizeBytes = 0
    try { sizeBytes = fs.statSync(abs).size } catch { /* file unreadable — skip size */ }
    onProgress?.(i + 1, sorted.length)
    return { relativePath: rel, extension: ext, sizeBytes }
  })
}

export function detectProjectType(files: FileInfo[]): ProjectType {
  const exts = new Set(files.map(f => f.extension))
  if (exts.has('ts') || exts.has('tsx') || exts.has('js') || exts.has('jsx')) return 'nodejs'
  if (exts.has('py')) return 'python'
  if (exts.has('go')) return 'go'
  if (exts.has('rs')) return 'rust'
  if (exts.has('java') || exts.has('kt')) return 'java'
  return 'unknown'
}

export function buildTree(files: FileInfo[], maxDepth = 4): string {
  type TreeNode = Record<string, TreeNode | null>
  const tree: TreeNode = {}

  for (const file of files) {
    const parts = file.relativePath.replace(/\\/g, '/').split('/')
    if (parts.length > maxDepth) continue
    let node = tree
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = {}
      node = node[parts[i]] as TreeNode
    }
    node[parts[parts.length - 1]] = null
  }

  return renderNode(tree, '')
}

export async function findTestFiles(projectPath: string, extraIgnore: string[] = []): Promise<string[]> {
  const patterns = [
    '**/*.test.{ts,tsx,js,jsx,py,java,go,kt}',
    '**/*.spec.{ts,tsx,js,jsx,py,java,go,kt}',
    '**/__tests__/**/*.{ts,tsx,js,jsx}',
    '**/test/**/*.{py,go,java,kt}',
    '**/tests/**/*.{py,go,java,kt}',
  ]
  const ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/vendor/**', ...extraIgnore]
  const files = await fg(patterns, { cwd: projectPath, ignore, onlyFiles: true })
  return files.slice(0, 150)
}

export function readKeyFiles(projectPath: string, files: FileInfo[]): Record<string, string> {
  const ENTRY_PATTERNS = /^(index|main|app|server|cmd|entrypoint|bootstrap|start)\./i
  const result: Record<string, string> = {}

  const candidates = [
    ...files.filter(f => ENTRY_PATTERNS.test(path.basename(f.relativePath))),
    ...files.filter(f => !ENTRY_PATTERNS.test(path.basename(f.relativePath))).sort((a, b) => b.sizeBytes - a.sizeBytes),
  ]

  const seen = new Set<string>()
  for (const f of candidates) {
    if (seen.size >= SCAN_LIMITS.keyFilesMax) break
    if (seen.has(f.relativePath)) continue
    seen.add(f.relativePath)
    try {
      const abs = path.join(projectPath, f.relativePath)
      const raw = fs.readFileSync(abs, 'utf-8')
      result[f.relativePath] = raw.length > SCAN_LIMITS.keyFileMaxBytes
        ? raw.slice(0, SCAN_LIMITS.keyFileMaxBytes) + '\n...(truncated)'
        : raw
    } catch { /* file unreadable — skip */ }
  }

  return result
}

function renderNode(node: Record<string, unknown>, prefix: string): string {
  const keys = Object.keys(node).sort((a, b) => {
    const aIsDir = node[a] !== null
    const bIsDir = node[b] !== null
    if (aIsDir && !bIsDir) return -1
    if (!aIsDir && bIsDir) return 1
    return a.localeCompare(b)
  })

  return keys
    .map((key, i) => {
      const isLast = i === keys.length - 1
      const connector = isLast ? '└── ' : '├── '
      const childPrefix = prefix + (isLast ? '    ' : '│   ')
      const child = node[key]
      const childLines =
        child && typeof child === 'object'
          ? '\n' + renderNode(child as Record<string, unknown>, childPrefix)
          : ''
      return prefix + connector + key + childLines
    })
    .join('\n')
}
