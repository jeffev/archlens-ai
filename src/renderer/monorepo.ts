import fs from 'fs'
import type { ArchlensReport } from '../types.js'

export interface WorkspaceResult {
  name: string
  reportFile: string
  report: ArchlensReport
}

export function renderMonorepoIndex(workspaces: WorkspaceResult[], outputPath: string): void {
  const html = generateMonorepoHTML(workspaces)
  fs.writeFileSync(outputPath, html, 'utf-8')
}

function scoreColor(s: number): string {
  if (s >= 70) return '#22c55e'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
}

function scoreBg(s: number): string {
  if (s >= 70) return '#052e16'
  if (s >= 40) return '#1c1004'
  return '#1c0505'
}

function healthDot(h: string): string {
  return h === 'good' ? '#22c55e' : h === 'warning' ? '#f59e0b' : '#ef4444'
}

function avgScore(workspaces: WorkspaceResult[]): number {
  if (!workspaces.length) return 0
  return Math.round(workspaces.reduce((s, w) => s + w.report.healthScore, 0) / workspaces.length)
}

function generateMonorepoHTML(workspaces: WorkspaceResult[]): string {
  const avg = avgScore(workspaces)
  const totalModules = workspaces.reduce((s, w) => s + w.report.current.modules.length, 0)
  const totalChanges = workspaces.reduce((s, w) => s + w.report.suggested.changes.length, 0)
  const criticalCount = workspaces.reduce((s, w) =>
    s + w.report.current.modules.filter(m => m.health === 'critical').length, 0)

  const cards = workspaces.map(w => {
    const r = w.report
    const topIssues = r.current.modules
      .flatMap(m => m.issues ?? [])
      .slice(0, 2)

    const techBadges = r.macro.nodes
      .slice(0, 4)
      .map(n => `<span style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:500;background:#0f172a;border:1px solid #1e293b;color:#64748b;">${n.name}</span>`)
      .join('')

    return `
    <a href="./${w.reportFile}" style="text-decoration:none;display:block;">
      <div class="card" onmouseenter="this.style.borderColor='rgba(99,102,241,.4)';this.style.background='#0a0f1e'"
           onmouseleave="this.style.borderColor='#1e293b';this.style.background='#060b18'">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
          <div>
            <div style="font-size:15px;font-weight:600;color:#e2e8f0;margin-bottom:3px;">${r.project.name}</div>
            <div style="font-size:11px;color:#475569;">${r.project.type}</div>
          </div>
          <div style="flex-shrink:0;width:52px;height:52px;border-radius:10px;background:${scoreBg(r.healthScore)};
               border:1px solid ${scoreColor(r.healthScore)}33;display:flex;align-items:center;justify-content:center;
               flex-direction:column;gap:1px;">
            <span style="font-size:18px;font-weight:700;color:${scoreColor(r.healthScore)};line-height:1;">${r.healthScore}</span>
            <span style="font-size:9px;color:${scoreColor(r.healthScore)}99;">/ 100</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:12px;">
          <div style="text-align:center;">
            <div style="font-size:16px;font-weight:600;color:#e2e8f0;">${r.current.modules.length}</div>
            <div style="font-size:10px;color:#475569;">módulos</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:16px;font-weight:600;color:#e2e8f0;">${r.suggested.changes.length}</div>
            <div style="font-size:10px;color:#475569;">sugestões</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:16px;font-weight:600;color:#e2e8f0;">${r.macro.nodes.length}</div>
            <div style="font-size:10px;color:#475569;">tecnologias</div>
          </div>
        </div>

        ${topIssues.length ? `
        <div style="margin-bottom:12px;">
          ${topIssues.map(issue => `
          <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
            <span style="flex-shrink:0;width:5px;height:5px;border-radius:50%;background:#f59e0b;margin-top:5px;"></span>
            <span style="font-size:11px;color:#64748b;line-height:1.4;">${issue}</span>
          </div>`).join('')}
        </div>` : ''}

        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">${techBadges}</div>

        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;gap:6px;">
            ${r.current.modules.slice(0, 5).map(m => `
            <div title="${m.name}" style="width:8px;height:8px;border-radius:50%;background:${healthDot(m.health)};opacity:.8;"></div>
            `).join('')}
          </div>
          <span style="font-size:11px;color:#6366f1;font-weight:500;">Ver relatório →</span>
        </div>
      </div>
    </a>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>archlens-ai — Monorepo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100%; font-family: 'Inter', ui-sans-serif, system-ui; background: #060b18; color: #e2e8f0; }
    .card {
      background: #060b18;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 18px;
      transition: border-color .15s, background .15s;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div style="max-width:1100px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
        <rect width="22" height="22" rx="6" fill="#6366f1"/>
        <path d="M6 11L11 6L16 11L11 16Z" stroke="white" stroke-width="1.5" fill="none"/>
        <circle cx="11" cy="11" r="2" fill="white"/>
      </svg>
      <h1 style="font-size:22px;font-weight:700;color:#e2e8f0;">archlens-ai — Monorepo</h1>
    </div>
    <p style="font-size:13px;color:#475569;margin-bottom:32px;">
      ${workspaces.length} workspaces analisados
    </p>

    <!-- Aggregated stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:36px;">
      ${[
        { label: 'Health Score médio', value: String(avg), color: scoreColor(avg) },
        { label: 'Total de módulos', value: String(totalModules), color: '#e2e8f0' },
        { label: 'Sugestões de melhoria', value: String(totalChanges), color: '#e2e8f0' },
        { label: 'Módulos críticos', value: String(criticalCount), color: criticalCount > 0 ? '#ef4444' : '#22c55e' },
      ].map(stat => `
      <div style="background:#0a0f1e;border:1px solid #1e293b;border-radius:10px;padding:16px;">
        <div style="font-size:24px;font-weight:700;color:${stat.color};margin-bottom:4px;">${stat.value}</div>
        <div style="font-size:11px;color:#475569;">${stat.label}</div>
      </div>`).join('')}
    </div>

    <!-- Workspace cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
      ${cards}
    </div>

    <p style="text-align:center;font-size:11px;color:#1e293b;margin-top:40px;">
      Gerado por archlens-ai
    </p>
  </div>
</body>
</html>`
}
