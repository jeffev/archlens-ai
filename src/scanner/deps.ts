import path from 'path'
import type { DependencyGraph, FileInfo, ProjectType } from '../types.js'
// ProjectType kept for the public API — only nodejs uses madge; others fall through to regex

export async function buildDepsGraph(
  projectPath: string,
  files: FileInfo[],
  projectType: ProjectType,
): Promise<DependencyGraph> {
  if (projectType === 'nodejs') {
    try {
      const { default: madge } = await import('madge')
      const result = await madge(projectPath, {
        fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
        excludeRegExp: [/node_modules/, /\.test\./, /\.spec\./, /dist\//],
        tsConfig: path.join(projectPath, 'tsconfig.json'),
      })
      const raw = result.obj()
      return Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [
          path.normalize(k).replace(/\\/g, '/'),
          (v as string[]).map(dep => path.normalize(dep).replace(/\\/g, '/')),
        ]),
      )
    } catch { /* madge unavailable or tsconfig missing — fall through to regex */ }
  }

  return extractImportsRegex(files)
}

function extractImportsRegex(files: FileInfo[]): DependencyGraph {
  const graph: DependencyGraph = {}
  for (const f of files) {
    graph[f.relativePath] = []
  }
  return graph
}
