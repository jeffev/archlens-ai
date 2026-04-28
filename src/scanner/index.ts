import path from 'path'
import fs from 'fs'
import type { ProjectScan } from '../types.js'
import { scanFiles, detectProjectType, buildTree, readKeyFiles, findTestFiles } from './files.js'
import { buildDepsGraph } from './deps.js'
import { scanConfigFiles } from './config.js'
import type { ConfigFiles } from './config.js'
import type { ArchlensConfig } from '../config.js'

export type { ConfigFiles }

export async function scan(
  projectPath: string,
  config: Pick<ArchlensConfig, 'ignore' | 'depth'> = {},
  onProgress?: (current: number, total: number) => void,
): Promise<ProjectScan> {
  const name = path.basename(projectPath)
  const files = await scanFiles(projectPath, config.ignore ?? [], onProgress)
  const type = detectProjectType(files)
  const tree = buildTree(files)
  const dependencies = await buildDepsGraph(projectPath, files, type)

  let packageInfo: Record<string, unknown> | undefined
  const pkgPath = path.join(projectPath, 'package.json')
  if (fs.existsSync(pkgPath)) {
    try { packageInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) } catch {}
  }

  const fileContents = config.depth === 'deep' ? readKeyFiles(projectPath, files) : undefined
  const testFiles = await findTestFiles(projectPath, config.ignore ?? [])

  return { name, path: projectPath, type, files, testFiles, tree, dependencies, packageInfo, fileContents }
}

export { scanConfigFiles }
