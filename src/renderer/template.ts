import type { ArchlensReport } from '../types.js'

export function generateHTML(report: ArchlensReport, cytoscapeJs = ''): string {
  const safeJson = JSON.stringify(report)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>archlens-ai — ${report.project.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; font-family: 'Inter', ui-sans-serif, system-ui; background: #060b18; color: #e2e8f0; }
    #cy { width: 100%; height: 100%; cursor: grab; }
    #cy:active { cursor: grabbing; }

    /* Tabs */
    .tab-btn { padding: 5px 13px; border-radius: 6px; font-size: 13px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all .15s; position: relative; background: none; }
    .tab-btn.active { background: rgba(99,102,241,.15); color: #a5b4fc; border-color: rgba(99,102,241,.4); }
    .tab-btn:not(.active) { color: #475569; }
    .tab-btn:not(.active):hover { color: #94a3b8; background: rgba(255,255,255,.04); }
    .badge-count { position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; font-size: 9px; display: flex; align-items: center; justify-content: center; color: #fff; }

    /* Panel */
    .panel-scroll { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
    .panel-scroll::-webkit-scrollbar { width: 3px; }
    .panel-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    /* Changes */
    .changes-scroll { overflow-x: auto; scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
    .changes-scroll::-webkit-scrollbar { height: 3px; }
    .changes-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

    /* Buttons */
    .icon-btn { width: 30px; height: 30px; background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-size: 15px; }
    .icon-btn:hover { color: #e2e8f0; border-color: #334155; }
    .layout-btn { padding: 4px 9px; font-size: 11px; font-weight: 500; background: #0f172a; border: 1px solid #1e293b; border-radius: 5px; color: #475569; cursor: pointer; transition: all .15s; }
    .layout-btn:hover { color: #94a3b8; border-color: #334155; }
    .layout-btn.active { background: rgba(99,102,241,.1); color: #818cf8; border-color: rgba(99,102,241,.3); }

    /* List rows */
    .list-row { width: 100%; display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; background: none; border: none; cursor: pointer; text-align: left; transition: background .15s; }
    .list-row:hover { background: rgba(255,255,255,.04); }

    /* Chips */
    .chip { padding: 3px 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; font-size: 12px; color: #94a3b8; }
    .dep-chip { cursor: pointer; transition: all .15s; font-family: monospace; }
    .dep-chip:hover { border-color: #6366f1; color: #a5b4fc; }
    .cat-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }

    /* Search */
    #search-wrap { position: relative; }
    #search-input { width: 180px; padding: 5px 28px 5px 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; font-size: 12px; color: #94a3b8; outline: none; transition: all .15s; font-family: inherit; }
    #search-input::placeholder { color: #334155; }
    #search-input:focus { border-color: rgba(99,102,241,.4); color: #e2e8f0; width: 220px; }
    #search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #334155; cursor: pointer; font-size: 14px; display: none; }
    #search-clear:hover { color: #64748b; }

    /* Tooltip */
    #tooltip { position: fixed; pointer-events: none; z-index: 9999; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 8px 12px; max-width: 240px; display: none; box-shadow: 0 4px 24px rgba(0,0,0,.5); }

    /* Breadcrumb */
    #breadcrumb { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-bottom: 1px solid #0f172a; flex-wrap: wrap; min-height: 36px; }
    .bc-item { font-size: 12px; color: #334155; cursor: pointer; padding: 1px 4px; border-radius: 4px; transition: color .15s; white-space: nowrap; background: none; border: none; }
    .bc-item:hover { color: #94a3b8; }
    .bc-item.current { color: #94a3b8; cursor: default; }
    .bc-item.current:hover { color: #94a3b8; }
    .bc-sep { font-size: 11px; color: #1e293b; }

    /* Cycle badge */
    .cycle-badge { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }

    /* Score bar */
    .score-bar-track { height: 4px; border-radius: 2px; background: #0f172a; flex: 1; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 2px; }

    /* Anti-pattern tag */
    .ap-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body style="display:flex;flex-direction:column;height:100%;">

  <!-- TOOLTIP -->
  <div id="tooltip">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <div id="tt-dot" style="width:7px;height:7px;border-radius:50%;flex-shrink:0;"></div>
      <span id="tt-name" style="font-size:13px;font-weight:600;color:#e2e8f0;"></span>
    </div>
    <p id="tt-desc" style="font-size:12px;color:#64748b;line-height:1.4;"></p>
    <p id="tt-hint" style="font-size:11px;color:#334155;margin-top:4px;">clique para detalhes</p>
  </div>

  <!-- HEADER -->
  <header style="flex-shrink:0;height:52px;border-bottom:1px solid #0f172a;padding:0 16px;display:flex;align-items:center;gap:14px;background:#080d1a;">
    <div style="display:flex;align-items:center;gap:7px;flex-shrink:0;">
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#6366f1"/><path d="M6 11L11 6L16 11L11 16Z" stroke="white" stroke-width="1.5" fill="none"/><circle cx="11" cy="11" r="2" fill="white"/></svg>
      <span style="font-weight:600;font-size:14px;color:#e2e8f0;letter-spacing:-.3px;">archlens-ai</span>
    </div>

    <div style="font-size:12px;color:#1e293b;flex-shrink:0;">
      <span style="color:#94a3b8;font-weight:500;">${report.project.name}</span>
      <span style="margin:0 5px;color:#0f172a;">·</span>
      <span style="color:#4f46e5;">${report.project.type}</span>
    </div>

    <nav style="display:flex;gap:3px;" id="tabs">
      <button class="tab-btn" onclick="switchTab('sistema')" id="tab-sistema">Sistema</button>
      <button class="tab-btn" onclick="switchTab('current')" id="tab-current">Estado Atual</button>
      <button class="tab-btn" onclick="switchTab('suggested')" id="tab-suggested">Sugerido</button>
      <button class="tab-btn" onclick="switchTab('diff')" id="tab-diff">Diff<span class="badge-count" id="diff-badge" style="display:${report.suggested.changes.length > 0 ? 'flex' : 'none'}">${report.suggested.changes.length}</span></button>
      <!-- analyze-only tabs -->
      <button class="tab-btn" onclick="switchTab('ciclos')" id="tab-ciclos">Ciclos<span class="badge-count" id="cycles-badge" style="display:none;"></span></button>
      <button class="tab-btn" onclick="switchTab('qualidade')" id="tab-qualidade">Qualidade<span class="badge-count" id="ap-badge" style="display:none;"></span></button>
      <!-- suggest-only tabs -->
      <button class="tab-btn" onclick="switchTab('decisoes')" id="tab-decisoes">Decisões</button>
      <button class="tab-btn" onclick="switchTab('roadmap')" id="tab-roadmap">Roadmap</button>
    </nav>

    <!-- Search -->
    <div id="search-wrap" style="flex:1;max-width:240px;">
      <input id="search-input" placeholder="Buscar nó..." oninput="onSearch(this.value)" />
      <button id="search-clear" onclick="clearSearch()">×</button>
    </div>

    <div style="margin-left:auto;display:flex;align-items:center;gap:10px;flex-shrink:0;">
      <button id="btn-written" onclick="toggleWrittenReport()" title="Toggle written report" style="display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid #1e293b;background:#0f172a;color:#475569;cursor:pointer;transition:all .15s;font-family:inherit;" onmouseover="if(!writtenMode){this.style.color='#94a3b8';this.style.borderColor='#334155';}" onmouseout="if(!writtenMode){this.style.color='#475569';this.style.borderColor='#1e293b';}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Relatório
      </button>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#1e293b;margin-bottom:1px;">Health Score</div>
        <div style="font-size:16px;font-weight:700;" id="hdr-score">${report.healthScore}/100</div>
      </div>
      <div style="width:48px;height:4px;background:#0f172a;border-radius:99px;overflow:hidden;">
        <div id="hdr-bar" style="height:100%;border-radius:99px;transition:width .5s;width:${report.healthScore}%;"></div>
      </div>
    </div>
  </header>

  <!-- MAIN -->
  <div style="flex:1;display:flex;overflow:hidden;position:relative;">

  <!-- WRITTEN REPORT OVERLAY -->
  <div id="written-report" style="display:none;position:absolute;inset:0;overflow-y:auto;background:#060b18;z-index:50;scrollbar-width:thin;scrollbar-color:#1e293b transparent;">
    <div id="written-content" style="max-width:820px;margin:0 auto;padding:48px 32px 80px;"></div>
  </div>

    <!-- GRAPH AREA -->
    <div style="flex:1;position:relative;background:#060b18;">
      <div id="cy"></div>

      <!-- Legends -->
      <div id="legend-diff" style="display:none;position:absolute;bottom:14px;left:14px;background:#080d1a;border:1px solid #0f172a;border-radius:10px;padding:10px 13px;">
        <div style="font-size:10px;color:#1e293b;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px;">Legenda</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b;"><div style="width:10px;height:10px;border-radius:3px;border:2px solid #10b981;"></div>Novo</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b;"><div style="width:10px;height:10px;border-radius:3px;border:2px solid #ef4444;opacity:.7"></div>Remover</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b;"><div style="width:10px;height:10px;border-radius:3px;border:2px solid #f59e0b;"></div>Alterado</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b;"><div style="width:10px;height:10px;border-radius:3px;border:2px solid #1e293b;"></div>Sem mudança</div>
        </div>
      </div>

      <div id="legend-sistema" style="position:absolute;bottom:14px;left:14px;background:#080d1a;border:1px solid #0f172a;border-radius:10px;padding:10px 13px;">
        <div style="font-size:10px;color:#1e293b;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px;">Categorias</div>
        <div id="legend-cats" style="display:flex;flex-direction:column;gap:5px;"></div>
      </div>

      <!-- Zoom buttons -->
      <div style="position:absolute;top:14px;right:14px;display:flex;flex-direction:column;gap:4px;">
        <button class="icon-btn" onclick="cy.zoom(cy.zoom()*1.25);cy.center()">+</button>
        <button class="icon-btn" onclick="cy.zoom(cy.zoom()*.8);cy.center()">−</button>
        <button class="icon-btn" onclick="cy.fit(undefined,44)" style="font-size:11px;">⊞</button>
      </div>

      <!-- Layout toggle (hidden on Sistema tab) -->
      <div id="layout-toggle" style="position:absolute;bottom:14px;right:14px;display:flex;gap:3px;background:#080d1a;border:1px solid #0f172a;border-radius:8px;padding:3px;">
        <button class="layout-btn active" id="layout-cose" onclick="setLayout('cose')" title="Force-directed">Força</button>
        <button class="layout-btn" id="layout-breadthfirst" onclick="setLayout('breadthfirst')" title="Hierárquico">Árvore</button>
        <button class="layout-btn" id="layout-circle" onclick="setLayout('circle')" title="Circular">Anel</button>
      </div>

      <!-- Empty state overlay -->
      <div id="cy-empty" style="display:none;position:absolute;inset:0;flex-direction:column;align-items:center;justify-content:center;gap:10px;pointer-events:none;">
        <div style="font-size:40px;opacity:.15;">◈</div>
        <div id="cy-empty-msg" style="font-size:14px;font-weight:600;color:#334155;"></div>
        <p id="cy-empty-sub" style="font-size:12px;color:#1e293b;text-align:center;line-height:1.5;max-width:280px;"></p>
      </div>
    </div>

    <!-- SIDE PANEL -->
    <div style="width:300px;flex-shrink:0;border-left:1px solid #0f172a;display:flex;flex-direction:column;background:#080d1a;overflow:hidden;">

      <!-- Breadcrumb -->
      <div id="breadcrumb"></div>

      <!-- === SISTEMA OVERVIEW === -->
      <div id="panel-sistema-overview" class="panel-scroll" style="flex:1;padding:14px;display:flex;flex-direction:column;gap:14px;">
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Arquitetura de Sistema</div>
          <p style="font-size:13px;color:#64748b;line-height:1.6;" id="so-summary"></p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
          <div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;">
            <div style="font-size:20px;font-weight:700;color:#e2e8f0;" id="so-tech-count"></div>
            <div style="font-size:11px;color:#334155;margin-top:2px;">tecnologias</div>
          </div>
          <div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;">
            <div style="font-size:20px;font-weight:700;color:#e2e8f0;" id="so-int-count"></div>
            <div style="font-size:11px;color:#334155;margin-top:2px;">integrações</div>
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px;">Tecnologias</div>
          <div id="so-nodes-list" style="display:flex;flex-direction:column;gap:2px;"></div>
        </div>
      </div>

      <!-- === TECH DETAIL === -->
      <div id="panel-tech-detail" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
            <h2 style="font-size:15px;font-weight:600;color:#e2e8f0;" id="td-name"></h2>
            <button onclick="clearSelection()" style="color:#1e293b;font-size:20px;line-height:1;cursor:pointer;background:none;border:none;padding:0 4px;flex-shrink:0;">×</button>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;flex-wrap:wrap;">
            <span id="td-cat-badge" class="cat-badge"></span>
            <span style="font-size:12px;color:#334155;font-family:monospace;" id="td-version"></span>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="width:7px;height:7px;border-radius:50%;" id="td-health-dot"></div>
            <span style="font-size:12px;" id="td-health-label"></span>
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Descrição</div>
          <p style="font-size:13px;color:#64748b;line-height:1.6;" id="td-desc"></p>
        </div>
        <div id="td-issues-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Problemas</div>
          <ul id="td-issues" style="list-style:none;display:flex;flex-direction:column;gap:6px;"></ul>
        </div>
        <div id="td-sugg-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Sugestões</div>
          <ul id="td-sugg" style="list-style:none;display:flex;flex-direction:column;gap:6px;"></ul>
        </div>
        <div id="td-modules-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px;">Módulos que usam esta tecnologia</div>
          <div id="td-modules" style="display:flex;flex-direction:column;gap:2px;"></div>
        </div>
      </div>

      <!-- === MICRO OVERVIEW === -->
      <div id="panel-micro-overview" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Resumo</div>
          <p style="font-size:13px;color:#64748b;line-height:1.6;" id="mo-summary"></p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
          <div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;">
            <div style="font-size:20px;font-weight:700;color:#e2e8f0;" id="mo-mod-count"></div>
            <div style="font-size:11px;color:#334155;margin-top:2px;">módulos</div>
          </div>
          <div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;">
            <div style="font-size:20px;font-weight:700;" id="mo-score"></div>
            <div style="font-size:11px;color:#334155;margin-top:2px;">health score</div>
          </div>
        </div>
        <div id="mo-stack-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px;">Tech Stack</div>
          <div id="mo-stack" style="display:flex;flex-wrap:wrap;gap:5px;"></div>
        </div>
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px;">Módulos</div>
          <div id="mo-modules-list" style="display:flex;flex-direction:column;gap:2px;"></div>
        </div>
      </div>

      <!-- === MODULE DETAIL === -->
      <div id="panel-module-detail" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
            <h2 style="font-size:15px;font-weight:600;color:#e2e8f0;" id="md-name"></h2>
            <button onclick="clearSelection()" style="color:#1e293b;font-size:20px;line-height:1;cursor:pointer;background:none;border:none;padding:0 4px;flex-shrink:0;">×</button>
          </div>
          <div style="font-size:11px;font-family:monospace;color:#4f46e5;margin-bottom:7px;" id="md-path"></div>
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:5px;">
              <div style="width:7px;height:7px;border-radius:50%;" id="md-health-dot"></div>
              <span style="font-size:12px;" id="md-health-label"></span>
            </div>
            <span id="md-badge-new"    style="display:none;font-size:11px;background:rgba(16,185,129,.12);color:#34d399;padding:2px 7px;border-radius:4px;">NOVO</span>
            <span id="md-badge-removed" style="display:none;font-size:11px;background:rgba(239,68,68,.12);color:#f87171;padding:2px 7px;border-radius:4px;">REMOVER</span>
            <span id="md-badge-changed" style="display:none;font-size:11px;background:rgba(245,158,11,.12);color:#fbbf24;padding:2px 7px;border-radius:4px;">ALTERADO</span>
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Descrição</div>
          <p style="font-size:13px;color:#64748b;line-height:1.6;" id="md-desc"></p>
        </div>
        <div id="md-resp-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Responsabilidades</div>
          <ul id="md-resp" style="list-style:none;display:flex;flex-direction:column;gap:4px;"></ul>
        </div>
        <div id="md-deps-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Depende de</div>
          <div id="md-deps" style="display:flex;flex-wrap:wrap;gap:5px;"></div>
        </div>
        <div id="md-tech-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Tecnologias usadas</div>
          <div id="md-tech" style="display:flex;flex-wrap:wrap;gap:5px;"></div>
        </div>
        <div id="md-issues-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Problemas</div>
          <ul id="md-issues" style="list-style:none;display:flex;flex-direction:column;gap:6px;"></ul>
        </div>
        <div id="md-sugg-wrap">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Sugestões</div>
          <ul id="md-sugg" style="list-style:none;display:flex;flex-direction:column;gap:6px;"></ul>
        </div>
        <div id="md-score-wrap" style="display:none;">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:8px;">Score do Módulo</div>
          <div id="md-score-total" style="font-size:24px;font-weight:700;margin-bottom:10px;"></div>
          <div style="display:flex;flex-direction:column;gap:7px;" id="md-score-bars"></div>
          <p style="font-size:12px;color:#334155;line-height:1.5;margin-top:8px;" id="md-score-rationale"></p>
        </div>
        <div id="md-ap-wrap" style="display:none;">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px;">Anti-Patterns</div>
          <div id="md-ap-list" style="display:flex;flex-direction:column;gap:7px;"></div>
        </div>
        <div id="md-test-wrap" style="display:none;">
          <div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:5px;">Testes</div>
          <div id="md-test-status"></div>
        </div>
      </div>

      <!-- === CICLOS PANEL === -->
      <div id="panel-ciclos" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <!-- filled dynamically -->
      </div>

      <!-- === QUALIDADE PANEL === -->
      <div id="panel-qualidade" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:18px;">
        <!-- filled dynamically -->
      </div>

      <!-- === DECISÕES PANEL === -->
      <div id="panel-decisoes" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <!-- filled dynamically -->
      </div>

      <!-- === ROADMAP PANEL === -->
      <div id="panel-roadmap" class="panel-scroll" style="display:none;flex:1;padding:14px;flex-direction:column;gap:14px;">
        <!-- filled dynamically -->
      </div>

    </div>
  </div>
  </div>

  <!-- CHANGES PANEL (bottom) -->
  <div id="changes-panel" style="display:none;flex-shrink:0;border-top:1px solid #0f172a;background:#080d1a;">
    <button onclick="toggleChanges()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 18px;background:none;border:none;cursor:pointer;color:#334155;transition:color .15s;" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#334155'">
      <div style="display:flex;align-items:center;gap:7px;">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Mudanças Propostas</span>
        <span id="changes-count" style="background:rgba(99,102,241,.15);color:#818cf8;font-size:10px;padding:1px 6px;border-radius:4px;"></span>
      </div>
      <span id="changes-arrow" style="font-size:11px;">▸</span>
    </button>
    <div id="changes-body" style="display:none;">
      <div class="changes-scroll" style="padding:0 18px 14px;">
        <div id="changes-list" style="display:flex;gap:10px;width:max-content;"></div>
      </div>
    </div>
  </div>

  ${cytoscapeJs ? `<script>${cytoscapeJs}</script>` : '<script src="https://unpkg.com/cytoscape@3.28.1/dist/cytoscape.min.js"></script>'}
  <script>
    const REPORT = ${safeJson};

    // ── Constants ────────────────────────────────────────────────────────────
    const CAT_COLOR  = { framework:'#6366f1', database:'#3b82f6', cache:'#f97316', messaging:'#a855f7', app:'#14b8a6', external:'#64748b' };
    const CAT_BG     = { framework:'#1e1b4b', database:'#0c1a3b', cache:'#1c0f05', messaging:'#1a0b2e', app:'#042f2e', external:'#0a0f1a' };
    const CAT_LABEL  = { framework:'Framework', database:'Banco de Dados', cache:'Cache', messaging:'Mensageria', app:'Aplicação', external:'Externo' };
    const PROTO_COLOR = { JDBC:'#3b82f6', AMQP:'#a855f7', 'Redis Protocol':'#f97316', HTTP:'#10b981', HTTPS:'#10b981', gRPC:'#f59e0b', WebSocket:'#06b6d4', TCP:'#64748b', SMTP:'#ec4899' };
    const TAB_LABEL  = { sistema:'Sistema', current:'Estado Atual', suggested:'Sugerido', diff:'Diff', ciclos:'Ciclos', qualidade:'Qualidade', decisoes:'Decisões', roadmap:'Roadmap' };
    const AP_LABEL   = { 'god-class':'God Class', 'feature-envy':'Feature Envy', 'shotgun-surgery':'Shotgun Surgery', 'data-clump':'Data Clump', 'dead-code':'Dead Code', 'primitive-obsession':'Primitive Obsession' };
    const AP_COLOR   = { low:'#f59e0b', medium:'#f97316', high:'#ef4444' };
    const AP_BG      = { low:'#1c1004', medium:'#1c0a04', high:'#1c0505' };
    const LAYER_COLOR  = { frontend:'#818cf8', auth:'#fbbf24', data:'#a78bfa', infra:'#34d399', backend:'#60a5fa' };
    const LAYER_BG     = { frontend:'rgba(99,102,241,0.07)', auth:'rgba(245,158,11,0.07)', data:'rgba(139,92,246,0.07)', infra:'rgba(16,185,129,0.07)', backend:'rgba(59,130,246,0.07)' };
    const LAYER_LABELS = { frontend:'FRONTEND', auth:'AUTH', data:'DATA', infra:'INFRA', backend:'BACKEND' };

    // ── State ────────────────────────────────────────────────────────────────
    let activeTab = 'sistema';
    let selectedTech = null;
    let selectedModule = null;
    let changesOpen = false;
    let cy = null;
    let navHistory = [];        // breadcrumb: [{label, restore}]
    let silentNav = false;      // prevents recursive history push
    let searchQuery = '';       // search filter
    let currentLayout = 'cose'; // active layout

    // ── Helpers ──────────────────────────────────────────────────────────────
    const hColor = h => h==='good'?'#10b981':h==='warning'?'#f59e0b':'#ef4444';
    const hLabel = h => h==='good'?'Saudável':h==='warning'?'Atenção':'Crítico';
    const sColor = s => s>=70?'#10b981':s>=40?'#f59e0b':'#ef4444';
    const iColor = i => i==='high'?'#f87171':i==='medium'?'#fbbf24':'#34d399';
    const chIcon = t => ({split:'⚡',merge:'⊕',move:'→',create:'+',remove:'×',rename:'✎',refactor:'↺'}[t]||'•');
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    function inferLayer(mod) {
      const text = (mod.id + ' ' + mod.name + ' ' + (mod.path||'')).toLowerCase();
      if (/frontend|[\\/]ui[\\/]?|[\\/]view|component|page|screen|react|vue|angular|svelte|layout|template/.test(text)) return 'frontend';
      if (/auth|login|password|jwt|token|session|identity|permission|role|acl|oauth/.test(text)) return 'auth';
      if (/database|[\\/]db[\\/]|repo(?:sitory)?|model|entity|migration|store|redis|mongo|sql|dao|orm/.test(text)) return 'data';
      if (/config|env|setting|logger|log(?:ging)?|monitor|health|deploy|docker|k8s|cache|queue|message|event/.test(text)) return 'infra';
      return 'backend';
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    function setEmpty(show, msg = '', sub = '') {
      const el = document.getElementById('cy-empty');
      el.style.display = show ? 'flex' : 'none';
      if (show) {
        document.getElementById('cy-empty-msg').textContent = msg;
        document.getElementById('cy-empty-sub').textContent = sub;
      }
    }

    // ── Search ────────────────────────────────────────────────────────────────
    function onSearch(q) {
      searchQuery = q.trim();
      const clearBtn = document.getElementById('search-clear');
      clearBtn.style.display = searchQuery ? 'block' : 'none';
      applySearch();
    }

    function applySearch() {
      if (!cy) return;
      if (!searchQuery) { cy.elements().removeStyle('opacity'); return; }
      const q = searchQuery.toLowerCase();
      cy.nodes().forEach(n => {
        if (n.data('_isGroup') || n.data('_isLayer')) { n.style('opacity', 1); return; }
        const match = (n.data('label')||'').toLowerCase().includes(q);
        n.style('opacity', match ? 1 : 0.08);
      });
      cy.edges().style('opacity', 0.05);
    }

    function clearSearch() {
      document.getElementById('search-input').value = '';
      onSearch('');
    }

    // ── Tooltip ───────────────────────────────────────────────────────────────
    const ttEl = () => document.getElementById('tooltip');

    function showTooltip(nodeData, x, y) {
      const tt = ttEl();
      document.getElementById('tt-name').textContent = nodeData.label || '';
      document.getElementById('tt-desc').textContent = nodeData._desc || '';

      const color = nodeData.category
        ? (CAT_COLOR[nodeData.category] || '#64748b')
        : hColor(nodeData.health || 'good');
      document.getElementById('tt-dot').style.background = color;

      const rect = document.getElementById('cy').getBoundingClientRect();
      let tx = rect.left + x + 14, ty = rect.top + y - 10;
      tt.style.display = 'block';
      const tw = tt.offsetWidth, th = tt.offsetHeight;
      if (tx + tw > window.innerWidth - 8) tx = rect.left + x - tw - 14;
      if (ty + th > window.innerHeight - 8) ty = rect.top + y - th - 4;
      tt.style.left = tx + 'px';
      tt.style.top  = ty + 'px';
    }

    function hideTooltip() { ttEl().style.display = 'none'; }

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    function pushNav(label, restoreFn) {
      if (silentNav) return;
      navHistory.push({ label, restore: restoreFn });
      renderBreadcrumb();
    }

    function jumpNav(index) {
      silentNav = true;
      const item = navHistory[index];
      navHistory = navHistory.slice(0, index + 1);
      item.restore();
      renderBreadcrumb();
      silentNav = false;
    }

    function renderBreadcrumb() {
      const bc = document.getElementById('breadcrumb');
      if (navHistory.length <= 1) { bc.innerHTML = ''; return; }
      bc.innerHTML = navHistory.map((item, i) => {
        const isCurrent = i === navHistory.length - 1;
        const sep = i > 0 ? '<span class="bc-sep">›</span>' : '';
        return sep + '<button class="bc-item' + (isCurrent ? ' current' : '') + '" onclick="' + (isCurrent ? '' : 'jumpNav(' + i + ')') + '">' + esc(item.label) + '</button>';
      }).join('');
    }

    // ── Panels ────────────────────────────────────────────────────────────────
    const ALL_PANELS = ['panel-sistema-overview','panel-tech-detail','panel-micro-overview','panel-module-detail','panel-ciclos','panel-qualidade','panel-decisoes','panel-roadmap'];
    function showPanel(id) {
      ALL_PANELS.forEach(p => {
        const el = document.getElementById(p);
        el.style.display = p === id ? 'flex' : 'none';
      });
    }

    // ── Tab switch ────────────────────────────────────────────────────────────
    function switchTab(tab) {
      activeTab = tab;
      selectedTech = null;
      selectedModule = null;
      currentLayout = 'cose';
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('layout-cose').classList.add('active');
      navHistory = [{ label: TAB_LABEL[tab], restore: () => switchTab(tab) }];
      renderBreadcrumb();

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');

      document.getElementById('legend-diff').style.display    = tab === 'diff'    ? 'block' : 'none';
      document.getElementById('legend-sistema').style.display = tab === 'sistema' ? 'block' : 'none';
      document.getElementById('layout-toggle').style.display  = tab === 'sistema' ? 'none'  : 'flex';
      setEmpty(false);
      document.getElementById('changes-panel').style.display =
        (tab !== 'current' && tab !== 'sistema' && tab !== 'ciclos' && tab !== 'qualidade' && REPORT.suggested.changes.length > 0) ? 'block' : 'none';

      clearHighlight();
      clearSearch();
      updatePanel();
      updateCy();
    }

    function updatePanel() {
      if (activeTab === 'sistema') {
        showPanel(selectedTech ? 'panel-tech-detail' : 'panel-sistema-overview');
        if (!selectedTech) renderSistemaOverview();
      } else if (activeTab === 'ciclos') {
        showPanel('panel-ciclos');
      } else if (activeTab === 'qualidade') {
        showPanel('panel-qualidade');
        renderQualidade();
      } else if (activeTab === 'decisoes') {
        showPanel('panel-decisoes');
        renderDecisoes();
      } else if (activeTab === 'roadmap') {
        showPanel('panel-roadmap');
        renderRoadmap();
      } else {
        showPanel(selectedModule ? 'panel-module-detail' : 'panel-micro-overview');
        if (!selectedModule) renderMicroOverview();
      }
    }

    // ── Cytoscape elements ────────────────────────────────────────────────────
    const GRP_LABEL = { framework:'FRAMEWORKS', app:'SERVICES', database:'DATABASES', cache:'CACHE', messaging:'MESSAGING', external:'EXTERNAL' };

    function buildMacroElements() {
      const usedCats = [...new Set(REPORT.macro.nodes.map(n => n.category))];
      const parents = usedCats.map(cat => ({
        data: { id: 'grp-' + cat, label: GRP_LABEL[cat] || cat.toUpperCase(), _isGroup: true, _cat: cat }
      }));
      const nodes = REPORT.macro.nodes.map(n => ({
        data: { id: n.id, label: n.name, category: n.category, health: n.health, _desc: n.description, parent: 'grp-' + n.category }
      }));
      const nodeIds = new Set(REPORT.macro.nodes.map(n => n.id));
      const edges = REPORT.macro.integrations
        .filter(i => nodeIds.has(i.source) && nodeIds.has(i.target))
        .map(i => ({
          data: { id: i.id, source: i.source, target: i.target, label: i.protocol || '', _proto: i.protocol || '' }
        }));
      return parents.concat(nodes).concat(edges);
    }

    function buildMicroElements() {
      const mods = getMicroModules();
      const ids = new Set(mods.map(m => m.id));
      const scoreMap = Object.fromEntries((REPORT.moduleScores||[]).map(s => [s.moduleId, s.score]));

      const usedLayers = [...new Set(mods.map(m => inferLayer(m)))];
      const parents = usedLayers.map(layer => ({
        data: { id: 'layer-' + layer, label: LAYER_LABELS[layer] || layer.toUpperCase(), _isLayer: true, _layer: layer }
      }));

      const nodes = mods.map(m => {
        const score = scoreMap[m.id];
        const label = m.name + (score != null ? '\\n' + score : '');
        return {
          data: {
            id: m.id, label, health: m.health||'good',
            diffStatus: m.diffStatus||'unchanged', _desc: m.description,
            _score: score != null ? score : -1,
            parent: 'layer-' + inferLayer(m),
          }
        };
      });

      const edges = [];
      mods.forEach(m => {
        (m.dependencies||[]).forEach(dep => {
          if (ids.has(dep) && dep !== m.id)
            edges.push({ data: { id: m.id+'__'+dep, source: m.id, target: dep } });
        });
      });
      return parents.concat(nodes).concat(edges);
    }

    function buildCiclosElements() {
      const { nodeIds } = getCycleData();
      const mods = REPORT.current.modules;
      const ids = new Set(mods.map(m => m.id));
      const nodes = mods.map(m => ({
        data: { id: m.id, label: m.name, health: m.health||'good', _inCycle: nodeIds.has(m.id), _desc: m.description }
      }));
      const edges = [];
      mods.forEach(m => {
        (m.dependencies||[]).forEach(dep => {
          if (ids.has(dep) && dep !== m.id)
            edges.push({ data: { id: m.id+'__'+dep, source: m.id, target: dep,
              _inCycle: nodeIds.has(m.id) && nodeIds.has(dep) } });
        });
      });
      return nodes.concat(edges);
    }

    // ── Cytoscape styles ──────────────────────────────────────────────────────
    const BASE_NODE = {
      'background-color':'#080d1a', 'border-width':2, 'border-color':'#1e293b',
      'color':'#94a3b8', 'font-size':'12px', 'font-family':'Inter,ui-sans-serif',
      'label':'data(label)', 'text-valign':'center', 'text-halign':'center',
      'shape':'round-rectangle', 'padding':'13px', 'width':'label', 'height':'label',
      'transition-property':'background-color,border-color,border-width,opacity',
      'transition-duration':'180ms',
    };

    function macroStyle() {
      const s = [
        { selector:'node', style: BASE_NODE },

        // ── Compound / group container ──────────────────────────────────────
        { selector:':parent', style:{
          'shape':'round-rectangle',
          'background-opacity':0.12,
          'background-color':'#0a0f1e',
          'border-style':'dashed',
          'border-width':1.5,
          'border-color':'#1e293b',
          'border-opacity':0.9,
          'label':'data(label)',
          'text-valign':'top',
          'text-halign':'left',
          'text-margin-y':10,
          'text-margin-x':12,
          'font-size':'9px',
          'font-weight':'700',
          'color':'#334155',
          'padding':'32px',
          'z-compound-depth':'bottom',
          'transition-property':'border-color,background-color',
          'transition-duration':'180ms',
        }},

        { selector:'node.selected',  style:{ 'border-width':3, 'border-color':'#a5b4fc', 'color':'#e0e7ff' } },
        { selector:'edge', style:{ 'width':1.5, 'line-color':'#0f172a', 'target-arrow-color':'#1e293b', 'target-arrow-shape':'triangle', 'curve-style':'bezier', 'label':'data(label)', 'font-size':'10px', 'color':'#1e293b', 'text-rotation':'autorotate' } },
        { selector:'edge.selected', style:{ 'line-color':'#6366f1', 'target-arrow-color':'#6366f1', 'width':2.5, 'color':'#818cf8' } },
      ];

      Object.keys(CAT_COLOR).forEach(cat => {
        // Tech child nodes
        s.push({ selector:'node[category="'+cat+'"]', style:{ 'border-color':CAT_COLOR[cat], 'background-color':CAT_BG[cat] } });
        // Group/parent container per category
        s.push({ selector:'node[_cat="'+cat+'"]', style:{
          'border-color': CAT_COLOR[cat],
          'background-color': CAT_BG[cat],
          'color': CAT_COLOR[cat],
        }});
      });

      s.push({ selector:'node[health="critical"]', style:{ 'border-width':3 } });
      return s;
    }

    function microStyle() {
      const s = [
        { selector:'node', style:{ ...BASE_NODE, 'font-size':'11px', 'padding':'16px', 'min-width':'110px', 'text-wrap':'wrap', 'text-max-width':'130px', 'text-valign':'center' } },

        // Layer compound containers
        { selector:':parent', style:{
          'shape':'round-rectangle', 'background-opacity':0.5,
          'border-style':'dashed', 'border-width':1.5, 'border-opacity':0.7,
          'label':'data(label)', 'text-valign':'top', 'text-halign':'left',
          'text-margin-y':12, 'text-margin-x':14, 'font-size':'9px',
          'font-weight':'700', 'color':'#334155', 'padding':'36px',
          'z-compound-depth':'bottom',
          'transition-property':'border-color,background-color', 'transition-duration':'180ms',
        }},

        // Health-based node appearance
        { selector:'node:childless[health="good"]',     style:{ 'border-color':'#10b981', 'background-color':'#041f14' } },
        { selector:'node:childless[health="warning"]',  style:{ 'border-color':'#f59e0b', 'background-color':'#1a1000' } },
        { selector:'node:childless[health="critical"]', style:{ 'border-color':'#ef4444', 'background-color':'#1c0505', 'border-width':3, 'color':'#fca5a5' } },

        // Diff status overrides
        { selector:'node:childless[diffStatus="added"]',     style:{ 'border-color':'#10b981', 'background-color':'#042f1c', 'border-width':3 } },
        { selector:'node:childless[diffStatus="removed"]',   style:{ 'border-color':'#ef4444', 'background-color':'#1c0505', 'border-width':3, 'opacity':0.6 } },
        { selector:'node:childless[diffStatus="changed"]',   style:{ 'border-color':'#f59e0b', 'background-color':'#1c1200', 'border-width':3 } },

        // Score-based text color on the score line
        { selector:'node:childless[_score >= 70]', style:{ 'color':'#34d399' } },
        { selector:'node:childless[_score >= 40][_score < 70]', style:{ 'color':'#fbbf24' } },
        { selector:'node:childless[_score >= 0][_score < 40]', style:{ 'color':'#f87171' } },

        { selector:'node.selected', style:{ 'border-width':3, 'border-color':'#818cf8', 'background-color':'#1e1b4b', 'color':'#e0e7ff' } },
        { selector:'edge', style:{ 'width':1.5, 'line-color':'#1e293b', 'target-arrow-color':'#334155', 'target-arrow-shape':'triangle', 'curve-style':'bezier', 'opacity':0.7 } },
        { selector:'edge.selected', style:{ 'line-color':'#6366f1', 'target-arrow-color':'#6366f1', 'width':2.5, 'opacity':1 } },
      ];

      // Layer container color per layer type
      Object.keys(LAYER_COLOR).forEach(layer => {
        s.push({ selector:'node[_layer="'+layer+'"]', style:{
          'border-color': LAYER_COLOR[layer],
          'background-color': LAYER_BG[layer],
          'color': LAYER_COLOR[layer],
        }});
      });

      return s;
    }

    function ciclosStyle() {
      return [
        { selector:'node', style:{ ...BASE_NODE, 'opacity':0.2 } },
        { selector:'node[?_inCycle]', style:{ 'border-color':'#ef4444', 'background-color':'#1c0505', 'border-width':3, 'color':'#fca5a5', 'opacity':1 } },
        { selector:'node.selected', style:{ 'border-color':'#818cf8', 'color':'#e0e7ff', 'border-width':3, 'opacity':1 } },
        { selector:'edge', style:{ 'width':1.5, 'line-color':'#0f172a', 'target-arrow-color':'#0f172a', 'target-arrow-shape':'triangle', 'curve-style':'bezier', 'opacity':0.1 } },
        { selector:'edge[?_inCycle]', style:{ 'line-color':'#ef4444', 'target-arrow-color':'#ef4444', 'width':2.5, 'opacity':1 } },
      ];
    }

    // ── Tiered preset layout for Sistema tab ─────────────────────────────────
    // External (gateways/clients) → App (services) → Data (databases/cache)
    function computeMacroPositions() {
      const nodes = REPORT.macro.nodes;
      // Vertical tier: 0=top (entry), 1=app/framework, 2=bottom (data)
      const catTier = { external: 0, app: 1, framework: 1, database: 2, cache: 2, messaging: 2 };
      const byTier = {};
      nodes.forEach(n => {
        const tier = catTier[n.category] ?? 1;
        (byTier[tier] = byTier[tier] || []).push(n);
      });
      const usedTiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
      const X_PITCH = 210, Y_PITCH = 220;
      const posMap = {};
      usedTiers.forEach((tier, ti) => {
        const tierNodes = byTier[tier];
        const totalW = tierNodes.length * X_PITCH;
        tierNodes.forEach((n, i) => {
          posMap[n.id] = {
            x: i * X_PITCH - totalW / 2 + X_PITCH / 2,
            y: ti * Y_PITCH,
          };
        });
      });
      return posMap;
    }

    // ── Topological rank layout for micro tabs ───────────────────────────────
    // Rank 0 = no internal deps (foundations) → rightmost
    // Higher rank = more consumers (orchestrators) → leftmost
    // Arrows flow left→right: consumer depends on its dependencies to the right
    function computeColumnPositions() {
      const mods = getMicroModules();
      const ids = new Set(mods.map(m => m.id));

      // depCount[id] = how many internal deps this module has
      // usedBy[id]   = which modules depend on this module
      const depCount = {}, usedBy = {};
      mods.forEach(m => { depCount[m.id] = 0; usedBy[m.id] = []; });
      mods.forEach(m => {
        (m.dependencies || []).forEach(dep => {
          if (ids.has(dep) && dep !== m.id) {
            depCount[m.id]++;
            usedBy[dep].push(m.id);
          }
        });
      });

      // Kahn's BFS: rank = longest path from a node with depCount 0
      const rank = {};
      const remaining = Object.assign({}, depCount);
      const queue = mods.filter(m => depCount[m.id] === 0).map(m => m.id);
      queue.forEach(id => { rank[id] = 0; });
      while (queue.length > 0) {
        const id = queue.shift();
        usedBy[id].forEach(cId => {
          rank[cId] = Math.max(rank[cId] || 0, rank[id] + 1);
          remaining[cId]--;
          if (remaining[cId] === 0) queue.push(cId);
        });
      }
      // Fallback for nodes in cycles
      mods.forEach(m => { if (rank[m.id] === undefined) rank[m.id] = 0; });

      const maxRank = Math.max(...mods.map(m => rank[m.id]));

      // Group nodes by rank, sort within rank by layer then score desc
      const scoreMap = Object.fromEntries((REPORT.moduleScores||[]).map(s => [s.moduleId, s.score]));
      const layerOrder = { frontend:0, auth:1, backend:2, data:3, infra:4 };
      const byRank = {};
      mods.forEach(m => {
        const r = rank[m.id];
        (byRank[r] = byRank[r] || []).push(m);
      });
      Object.values(byRank).forEach(group => {
        group.sort((a, b) => {
          const la = layerOrder[inferLayer(a)] ?? 2, lb = layerOrder[inferLayer(b)] ?? 2;
          return la !== lb ? la - lb : (scoreMap[b.id] || 0) - (scoreMap[a.id] || 0);
        });
      });

      const X_PITCH = 240;  // horizontal distance between ranks
      const Y_PITCH = 150;  // vertical distance between nodes in same rank

      const posMap = {};
      Object.entries(byRank).forEach(([r, rankMods]) => {
        const ri = parseInt(r);
        // Rank 0 (foundations) on the right; higher rank (consumers) on the left
        const x = (maxRank - ri) * X_PITCH - (maxRank * X_PITCH) / 2;
        const totalH = rankMods.length * Y_PITCH;
        rankMods.forEach((m, i) => {
          posMap[m.id] = { x, y: i * Y_PITCH - totalH / 2 + Y_PITCH / 2 };
        });
      });
      return posMap;
    }

    // ── Layout ────────────────────────────────────────────────────────────────
    function getLayoutOpts(name) {
      const isMicro = activeTab !== 'sistema' && activeTab !== 'ciclos' && activeTab !== 'decisoes' && activeTab !== 'roadmap';
      if (name === 'breadthfirst') return { name:'breadthfirst', animate:true, animationDuration:400, directed:true, padding:44, spacingFactor:1.6 };
      if (name === 'circle')       return { name:'circle', animate:true, animationDuration:400, padding:44 };
      if (name === 'cose' && activeTab === 'sistema') return { name:'preset', positions: computeMacroPositions(), animate:true, animationDuration:500, fit:true, padding:80 };
      if (name === 'cose' && isMicro) return { name:'preset', positions: computeColumnPositions(), animate:true, animationDuration:500, fit:true, padding:80 };
      return { name:'cose', animate:true, animationDuration:500, nodeRepulsion:20000, idealEdgeLength:160, gravity:0.25, numIter:1000, initialTemp:200 };
    }

    function setLayout(name) {
      currentLayout = name;
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('layout-' + name).classList.add('active');
      if (cy) cy.layout(getLayoutOpts(name)).run();
    }

    // ── Init / update Cytoscape ───────────────────────────────────────────────
    function initCy() {
      const elements = buildMacroElements();
      cy = cytoscape({
        container: document.getElementById('cy'),
        elements, style: macroStyle(),
        layout: getLayoutOpts('cose'),
        userZoomingEnabled: true, userPanningEnabled: true, minZoom: 0.1, maxZoom: 4,
      });

      // Tooltip
      cy.on('mouseover', 'node', function(evt) {
        if (evt.target.data('_isGroup') || evt.target.data('_isLayer')) return;
        const rp = evt.renderedPosition;
        showTooltip(evt.target.data(), rp.x, rp.y);
      });
      cy.on('mouseout', 'node', hideTooltip);
      cy.on('grab', 'node', hideTooltip);

      // Selection
      cy.on('tap', 'node', function(evt) {
        if (evt.target.data('_isGroup') || evt.target.data('_isLayer')) return;
        hideTooltip();
        const id = evt.target.id();
        if (activeTab === 'sistema') {
          const tech = REPORT.macro.nodes.find(n => n.id === id);
          if (tech) selectTech(tech);
        } else {
          const mod = getMicroModules().find(m => m.id === id);
          if (mod) selectModule(mod);
        }
      });
      cy.on('tap', function(evt) { if (evt.target === cy) clearSelection(); });

      applyProtocolColors();
      setTimeout(() => cy.fit(undefined, 44), 100);
    }

    function updateCy() {
      if (!cy) return;
      if (activeTab === 'decisoes' || activeTab === 'roadmap') { setEmpty(false); return; }

      if (activeTab === 'sistema' && REPORT.macro.nodes.length === 0) {
        setEmpty(true, 'Nenhuma tecnologia encontrada', 'Claude não identificou componentes de sistema. Tente rodar novamente.');
        cy.elements().remove();
        return;
      }
      if (activeTab !== 'sistema' && activeTab !== 'ciclos' && getMicroModules().length === 0) {
        setEmpty(true, 'Nenhum módulo encontrado', 'Claude não retornou módulos. Tente --depth deep ou rode novamente.');
        cy.elements().remove();
        return;
      }
      setEmpty(false);

      const elements = activeTab === 'sistema' ? buildMacroElements()
                     : activeTab === 'ciclos'  ? buildCiclosElements()
                     : buildMicroElements();
      const style = activeTab === 'sistema' ? macroStyle()
                  : activeTab === 'ciclos'  ? ciclosStyle()
                  : microStyle();
      cy.elements().remove();
      cy.style(style);
      cy.add(elements);
      cy.layout({ ...getLayoutOpts(currentLayout), animate: true, animationDuration: 400 }).run();
      if (activeTab === 'sistema') setTimeout(applyProtocolColors, 50);
      setTimeout(() => cy.fit(undefined, 44), 500);
      applySearch();
    }

    // ── Protocol edge colors ──────────────────────────────────────────────────
    function applyProtocolColors() {
      REPORT.macro.integrations.forEach(i => {
        if (!i.protocol) return;
        const c = PROTO_COLOR[i.protocol];
        if (!c) return;
        cy.getElementById(i.id).style({ 'line-color':c, 'target-arrow-color':c, 'color':c });
      });
    }

    // ── Neighbor highlight ────────────────────────────────────────────────────
    function highlightNeighbors(nodeId) {
      const node = cy.getElementById(nodeId);
      const neighbors = node.neighborhood().add(node);
      cy.elements().style('opacity', 0.08);
      neighbors.style('opacity', 1);
      if (activeTab === 'sistema') cy.nodes('[?_isGroup]').style('opacity', 0.35);
      else cy.nodes('[?_isLayer]').style('opacity', 0.35);
    }

    function clearHighlight() {
      if (cy) cy.elements().removeStyle('opacity');
    }

    // ── Cycle detection ───────────────────────────────────────────────────────
    let _cycleCache = null;
    function getCycleData() {
      if (_cycleCache) return _cycleCache;
      const mods = REPORT.current.modules;
      const adj = Object.fromEntries(mods.map(m => [m.id, (m.dependencies||[]).filter(d => mods.find(x=>x.id===d))]));
      const visited = {}, onStack = {}, cycles = [];
      let path = [];

      function dfs(id) {
        visited[id] = onStack[id] = true;
        path.push(id);
        for (const dep of (adj[id]||[])) {
          if (!visited[dep]) { dfs(dep); }
          else if (onStack[dep]) {
            const start = path.indexOf(dep);
            if (start !== -1) cycles.push(path.slice(start));
          }
        }
        path.pop();
        onStack[id] = false;
      }
      mods.forEach(m => { if (!visited[m.id]) dfs(m.id); });

      // Deduplicate cycles
      const seen = new Set();
      const unique = cycles.filter(c => {
        const key = [...c].sort().join(',');
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });

      const nodeIds = new Set(unique.flat());
      const edgeIds = new Set(unique.flatMap(c => c.map((id,i) => id+'__'+c[(i+1)%c.length])));

      _cycleCache = { cycles: unique, nodeIds, edgeIds };
      return _cycleCache;
    }

    function renderCiclos() {
      const panel = document.getElementById('panel-ciclos');
      const { cycles, nodeIds } = getCycleData();

      // Update badge
      const badge = document.getElementById('cycles-badge');
      if (cycles.length > 0) {
        badge.textContent = String(cycles.length);
        badge.style.display = 'flex';
        badge.style.background = '#ef4444';
      } else {
        badge.style.display = 'none';
      }

      if (cycles.length === 0) {
        panel.innerHTML =
          '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;">'
          + '<div style="font-size:28px;">✓</div>'
          + '<div style="font-size:14px;font-weight:600;color:#10b981;">Nenhum ciclo detectado</div>'
          + '<p style="font-size:12px;color:#334155;line-height:1.5;">Nenhuma dependência circular<br/>encontrada nos módulos atuais.</p>'
          + '</div>';
        return;
      }

      const modName = id => { const m = REPORT.current.modules.find(x=>x.id===id); return m ? m.name : id; };

      let html = '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:4px;">'
        + cycles.length + ' ciclo(s) detectado(s)</div>'
        + '<p style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:10px;">Dependências circulares aumentam acoplamento e dificultam testes e manutenção.</p>'
        + '<div style="display:flex;flex-direction:column;gap:10px;">';

      cycles.forEach((cycle, i) => {
        const names = cycle.map(id => '<button onclick="selectModuleFromCycle(\\''+id+'\\')\" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:4px;padding:2px 7px;font-size:12px;color:#fca5a5;cursor:pointer;font-family:inherit;">'+esc(modName(id))+'</button>');
        html += '<div style="background:#0a0f1a;border:1px solid rgba(239,68,68,.15);border-radius:8px;padding:12px;">'
          + '<div style="font-size:11px;color:#64748b;margin-bottom:7px;">Ciclo ' + (i+1) + ' — ' + cycle.length + ' módulos</div>'
          + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;">'
          + names.join('<span style="color:#334155;font-size:10px;">→</span>')
          + '<span style="color:#334155;font-size:10px;">→ ...</span>'
          + '</div></div>';
      });

      html += '</div><div style="margin-top:12px;padding:10px;background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;">'
        + '<div style="font-size:11px;font-weight:600;color:#f59e0b;margin-bottom:5px;">Como resolver</div>'
        + '<p style="font-size:12px;color:#475569;line-height:1.5;">Introduza uma interface ou evento para inverter a dependência. Considere mover a lógica compartilhada para um módulo independente sem dependências de volta.</p>'
        + '</div>';

      panel.innerHTML = html;
    }

    function selectModuleFromCycle(id) {
      const mod = REPORT.current.modules.find(m => m.id === id);
      if (!mod) return;
      silentNav = true;
      switchTab('current');
      silentNav = false;
      selectModule(mod);
    }

    // ── Diff helpers ──────────────────────────────────────────────────────────
    function getDiffModules() {
      const cur = REPORT.current.modules, sug = REPORT.suggested.modules;
      const cMap = Object.fromEntries(cur.map(m=>[m.id,m]));
      const sMap = Object.fromEntries(sug.map(m=>[m.id,m]));
      const all = new Set([...cur.map(m=>m.id), ...sug.map(m=>m.id)]);
      return [...all].map(id => {
        const c=cMap[id], s=sMap[id];
        if (c&&!s) return Object.assign({},c,{diffStatus:'removed'});
        if (!c&&s) return Object.assign({},s,{diffStatus:'added'});
        const changed = JSON.stringify(c.responsibilities) !== JSON.stringify(s.responsibilities)
                     || JSON.stringify(c.dependencies) !== JSON.stringify(s.dependencies);
        return Object.assign({}, changed?s:c, {diffStatus:changed?'changed':'unchanged'});
      });
    }

    function getMicroModules() {
      if (activeTab==='current')   return REPORT.current.modules;
      if (activeTab==='suggested') return REPORT.suggested.modules;
      if (activeTab==='ciclos')    return REPORT.current.modules;
      return getDiffModules();
    }

    // ── Tech selection ────────────────────────────────────────────────────────
    function selectTech(tech) {
      selectedTech = tech;
      cy.nodes().removeClass('selected');
      cy.edges().removeClass('selected');
      cy.getElementById(tech.id).addClass('selected');
      cy.getElementById(tech.id).connectedEdges().addClass('selected');
      highlightNeighbors(tech.id);

      pushNav(tech.name, () => selectTech(tech));

      // Populate panel
      document.getElementById('td-name').textContent = tech.name;
      document.getElementById('td-version').textContent = tech.version ? 'v'+tech.version : '';
      document.getElementById('td-desc').textContent = tech.description || '';
      const cat = tech.category || 'external';
      const badge = document.getElementById('td-cat-badge');
      badge.textContent = CAT_LABEL[cat]||cat;
      badge.style.cssText += ';background:'+(CAT_BG[cat]||'#0a0f1a')+';color:'+(CAT_COLOR[cat]||'#64748b')+';border:1px solid '+(CAT_COLOR[cat]||'#1e293b')+';';
      document.getElementById('td-health-dot').style.background = hColor(tech.health);
      document.getElementById('td-health-label').style.color = hColor(tech.health);
      document.getElementById('td-health-label').textContent = hLabel(tech.health);

      renderList('td-issues', tech.issues||[], '!', '#f87171');
      document.getElementById('td-issues-wrap').style.display = (tech.issues||[]).length ? 'block' : 'none';
      renderList('td-sugg', tech.suggestions||[], '→', '#818cf8');
      document.getElementById('td-sugg-wrap').style.display = (tech.suggestions||[]).length ? 'block' : 'none';

      const relMods = REPORT.current.modules.filter(m=>(m.relatedTechIds||[]).includes(tech.id));
      const modsCont = document.getElementById('td-modules');
      modsCont.innerHTML = '';
      relMods.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'list-row';
        btn.innerHTML = '<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+hColor(m.health)+'"></div>'
          + '<span style="font-size:13px;color:#64748b;flex:1;">'+esc(m.name)+'</span>'
          + '<span style="font-size:11px;color:#1e293b;">→</span>';
        btn.onclick = () => {
          pushNav(m.name, () => {
            silentNav = true; switchTab('current'); silentNav = false; selectModule(m);
          });
          silentNav = true; switchTab('current'); silentNav = false; selectModule(m);
          renderBreadcrumb();
        };
        modsCont.appendChild(btn);
      });
      document.getElementById('td-modules-wrap').style.display = relMods.length ? 'block' : 'none';

      showPanel('panel-tech-detail');
    }

    // ── Module selection ──────────────────────────────────────────────────────
    function selectModule(mod) {
      selectedModule = mod;
      cy.nodes().removeClass('selected');
      cy.edges().removeClass('selected');
      cy.getElementById(mod.id).addClass('selected');
      cy.getElementById(mod.id).connectedEdges().addClass('selected');
      highlightNeighbors(mod.id);

      pushNav(mod.name, () => selectModule(mod));

      document.getElementById('md-name').textContent = mod.name;
      document.getElementById('md-path').textContent = mod.path || '';
      document.getElementById('md-desc').textContent = mod.description || '';
      document.getElementById('md-health-dot').style.background = hColor(mod.health);
      document.getElementById('md-health-label').style.color = hColor(mod.health);
      document.getElementById('md-health-label').textContent = hLabel(mod.health);
      document.getElementById('md-badge-new').style.display     = mod.diffStatus==='added'   ?'inline':'none';
      document.getElementById('md-badge-removed').style.display = mod.diffStatus==='removed' ?'inline':'none';
      document.getElementById('md-badge-changed').style.display = mod.diffStatus==='changed' ?'inline':'none';

      renderList('md-resp', mod.responsibilities||[], '·', '#6366f1');
      document.getElementById('md-resp-wrap').style.display = (mod.responsibilities||[]).length ? 'block' : 'none';

      const depsCont = document.getElementById('md-deps');
      depsCont.innerHTML = '';
      (mod.dependencies||[]).forEach(dep => {
        const c = document.createElement('span');
        c.className = 'chip dep-chip';
        c.textContent = dep;
        c.onclick = () => { const m=getMicroModules().find(x=>x.id===dep); if(m) selectModule(m); };
        depsCont.appendChild(c);
      });
      document.getElementById('md-deps-wrap').style.display = (mod.dependencies||[]).length ? 'block' : 'none';

      const techCont = document.getElementById('md-tech');
      techCont.innerHTML = '';
      (mod.relatedTechIds||[]).forEach(tid => {
        const tech = REPORT.macro.nodes.find(n=>n.id===tid);
        if (!tech) return;
        const c = document.createElement('span');
        c.className = 'chip dep-chip';
        c.style.color = CAT_COLOR[tech.category]||'#94a3b8';
        c.textContent = tech.name;
        c.onclick = () => {
          pushNav(tech.name, () => { silentNav=true; switchTab('sistema'); silentNav=false; selectTech(tech); });
          silentNav=true; switchTab('sistema'); silentNav=false; selectTech(tech);
          renderBreadcrumb();
        };
        techCont.appendChild(c);
      });
      document.getElementById('md-tech-wrap').style.display = (mod.relatedTechIds||[]).length ? 'block' : 'none';

      renderList('md-issues', mod.issues||[], '!', '#f87171');
      document.getElementById('md-issues-wrap').style.display = (mod.issues||[]).length ? 'block' : 'none';
      renderList('md-sugg', mod.suggestions||[], '→', '#818cf8');
      document.getElementById('md-sugg-wrap').style.display = (mod.suggestions||[]).length ? 'block' : 'none';

      // Score breakdown
      const ms = (REPORT.moduleScores||[]).find(s => s.moduleId === mod.id);
      const scoreWrap = document.getElementById('md-score-wrap');
      if (ms) {
        document.getElementById('md-score-total').innerHTML =
          '<span style="color:'+sColor(ms.score)+'">'+ms.score+'</span>'
          + '<span style="font-size:13px;font-weight:400;color:#334155;">/100</span>';
        const bars = document.getElementById('md-score-bars');
        bars.innerHTML = '';
        [['Coesão', ms.cohesion], ['Independência', ms.coupling], ['Tamanho', ms.size]].forEach(([label, val]) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:8px;';
          row.innerHTML = '<span style="font-size:11px;color:#475569;width:88px;flex-shrink:0;">'+label+'</span>'
            + '<div class="score-bar-track"><div class="score-bar-fill" style="width:'+val+'%;background:'+sColor(val)+'"></div></div>'
            + '<span style="font-size:11px;color:'+sColor(val)+';font-weight:600;width:28px;text-align:right;">'+val+'</span>';
          bars.appendChild(row);
        });
        document.getElementById('md-score-rationale').textContent = ms.rationale || '';
        scoreWrap.style.display = 'block';
      } else {
        scoreWrap.style.display = 'none';
      }

      // Anti-patterns
      const aps = (REPORT.antiPatterns||[]).filter(a => a.moduleId === mod.id);
      const apWrap = document.getElementById('md-ap-wrap');
      if (aps.length) {
        const apList = document.getElementById('md-ap-list');
        apList.innerHTML = '';
        aps.forEach(ap => {
          const el = document.createElement('div');
          el.style.cssText = 'background:'+AP_BG[ap.severity]+';border:1px solid '+AP_COLOR[ap.severity]+'33;border-radius:7px;padding:9px 11px;';
          el.innerHTML = '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">'
            + '<span class="ap-tag" style="background:'+AP_BG[ap.severity]+';color:'+AP_COLOR[ap.severity]+';border:1px solid '+AP_COLOR[ap.severity]+'44;">'+esc(AP_LABEL[ap.name]||ap.name)+'</span>'
            + '<span style="font-size:10px;font-weight:600;color:'+AP_COLOR[ap.severity]+';">'+ap.severity.toUpperCase()+'</span>'
            + '</div>'
            + '<p style="font-size:12px;color:#64748b;line-height:1.5;">'+esc(ap.description)+'</p>';
          apList.appendChild(el);
        });
        apWrap.style.display = 'block';
      } else {
        apWrap.style.display = 'none';
      }

      // Test status
      const tc = REPORT.testCoverage;
      const testWrap = document.getElementById('md-test-wrap');
      if (tc && tc.testFilesFound > 0) {
        const covered = (tc.coveredModules||[]).includes(mod.id);
        const priority = (tc.testPriorities||[]).indexOf(mod.id);
        document.getElementById('md-test-status').innerHTML =
          covered
            ? '<span style="font-size:12px;background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2);padding:3px 10px;border-radius:5px;">✓ Testado</span>'
            : '<span style="font-size:12px;background:rgba(239,68,68,.08);color:#f87171;border:1px solid rgba(239,68,68,.15);padding:3px 10px;border-radius:5px;">✗ Sem testes</span>'
              + (priority >= 0 ? '<span style="font-size:11px;color:#475569;margin-left:8px;">Prioridade #'+(priority+1)+'</span>' : '');
        testWrap.style.display = 'block';
      } else {
        testWrap.style.display = 'none';
      }

      showPanel('panel-module-detail');
    }

    function clearSelection() {
      selectedTech = null; selectedModule = null;
      if (cy) { cy.nodes().removeClass('selected'); cy.edges().removeClass('selected'); clearHighlight(); applySearch(); }
      updatePanel();
    }

    // ── List render helper ────────────────────────────────────────────────────
    function renderList(id, items, icon, iconColor) {
      const ul = document.getElementById(id);
      ul.innerHTML = '';
      items.forEach(item => {
        const li = document.createElement('li');
        li.style.cssText = 'display:flex;align-items:flex-start;gap:7px;font-size:13px;';
        li.innerHTML = '<span style="color:'+iconColor+';flex-shrink:0;font-weight:700;margin-top:1px;">'+icon+'</span>'
          + '<span style="color:#64748b;">'+esc(item)+'</span>';
        ul.appendChild(li);
      });
    }

    // ── Overview panels ───────────────────────────────────────────────────────
    function renderSistemaOverview() {
      document.getElementById('so-summary').textContent = REPORT.macro.summary || '';
      document.getElementById('so-tech-count').textContent = String(REPORT.macro.nodes.length);
      document.getElementById('so-int-count').textContent = String(REPORT.macro.integrations.length);

      const list = document.getElementById('so-nodes-list');
      list.innerHTML = '';
      REPORT.macro.nodes.forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'list-row';
        btn.innerHTML =
          '<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+hColor(n.health)+'"></div>'
          + '<span style="font-size:13px;color:#64748b;flex:1;">'+esc(n.name)+'</span>'
          + '<span style="font-size:11px;color:'+(CAT_COLOR[n.category]||'#334155')+';">'+esc(CAT_LABEL[n.category]||n.category)+'</span>';
        btn.onclick = () => selectTech(n);
        list.appendChild(btn);
      });

      const legCats = document.getElementById('legend-cats');
      legCats.innerHTML = '';
      [...new Set(REPORT.macro.nodes.map(n=>n.category))].forEach(cat => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;color:#475569;';
        row.innerHTML = '<div style="width:10px;height:10px;border-radius:3px;border:2px solid '+(CAT_COLOR[cat]||'#1e293b')+';background:'+(CAT_BG[cat]||'#0a0f1a')+'"></div>'+(CAT_LABEL[cat]||cat);
        legCats.appendChild(row);
      });
    }

    function renderMicroOverview() {
      const mods = getMicroModules();
      const summary = activeTab==='suggested' ? REPORT.suggested.summary : REPORT.current.summary;
      document.getElementById('mo-summary').textContent = summary || '';
      document.getElementById('mo-mod-count').textContent = String(mods.length);
      const sc = document.getElementById('mo-score');
      sc.textContent = String(REPORT.healthScore);
      sc.style.color = sColor(REPORT.healthScore);

      const stack = document.getElementById('mo-stack');
      stack.innerHTML = '';
      (REPORT.project.techStack||[]).forEach(t => {
        const c = document.createElement('span'); c.className='chip'; c.textContent=t; stack.appendChild(c);
      });
      document.getElementById('mo-stack-wrap').style.display = (REPORT.project.techStack||[]).length ? 'block':'none';

      const list = document.getElementById('mo-modules-list');
      list.innerHTML = '';
      mods.forEach(m => {
        const ms = (REPORT.moduleScores||[]).find(s => s.moduleId === m.id);
        const isTested = (REPORT.testCoverage?.coveredModules||[]).includes(m.id);
        const hasTests = (REPORT.testCoverage?.testFilesFound||0) > 0;
        const btn = document.createElement('button');
        btn.className = 'list-row';
        const diffBadge = m.diffStatus==='added'  ?'<span style="font-size:11px;color:#34d399;">+</span>'
                        : m.diffStatus==='removed'?'<span style="font-size:11px;color:#f87171;">−</span>'
                        : m.diffStatus==='changed'?'<span style="font-size:11px;color:#fbbf24;">~</span>':'';
        const testDot = hasTests
          ? '<span title="'+(isTested?'Testado':'Sem testes')+'" style="font-size:10px;'+(isTested?'color:#22c55e':'color:#334155')+';flex-shrink:0;">'+(isTested?'✓':'○')+'</span>'
          : '';
        const scoreBadge = ms
          ? '<span style="font-size:10px;font-weight:700;color:'+sColor(ms.score)+';min-width:22px;text-align:right;">'+ms.score+'</span>'
          : '';
        btn.innerHTML =
          '<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:'+hColor(m.health)+'"></div>'
          + '<span style="font-size:13px;color:#64748b;flex:1;">'+esc(m.name)+'</span>'
          + diffBadge + testDot + scoreBadge;
        btn.onclick = () => selectModule(m);
        list.appendChild(btn);
      });
    }

    // ── Qualidade panel ───────────────────────────────────────────────────────
    function renderQualidade() {
      const panel = document.getElementById('panel-qualidade');
      const tc = REPORT.testCoverage || { testFilesFound:0, coveredModules:[], uncoveredModules:[], coverageScore:0, testPriorities:[] };
      const aps = REPORT.antiPatterns || [];
      const scores = REPORT.moduleScores || [];

      let html = '';

      // ── Test coverage block ──
      const coverColor = sColor(tc.coverageScore);
      html += '<div>'
        + '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:10px;">Cobertura de Testes</div>';

      if (tc.testFilesFound === 0) {
        html += '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:14px;text-align:center;">'
          + '<div style="font-size:20px;margin-bottom:4px;">○</div>'
          + '<div style="font-size:13px;font-weight:600;color:#334155;">Nenhum arquivo de teste encontrado</div>'
          + '<p style="font-size:12px;color:#1e293b;margin-top:4px;line-height:1.4;">Adicionar testes unitários é a forma mais eficaz de proteger refatorações futuras.</p>'
          + '</div>';
      } else {
        const covered = tc.coveredModules.length, total = covered + tc.uncoveredModules.length;
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">'
          + '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;text-align:center;">'
            + '<div style="font-size:20px;font-weight:700;color:'+coverColor+';">'+tc.coverageScore+'%</div>'
            + '<div style="font-size:10px;color:#334155;margin-top:2px;">score</div></div>'
          + '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;text-align:center;">'
            + '<div style="font-size:20px;font-weight:700;color:#22c55e;">'+covered+'/'+total+'</div>'
            + '<div style="font-size:10px;color:#334155;margin-top:2px;">testados</div></div>'
          + '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:11px;text-align:center;">'
            + '<div style="font-size:20px;font-weight:700;color:#94a3b8;">'+tc.testFilesFound+'</div>'
            + '<div style="font-size:10px;color:#334155;margin-top:2px;">test files</div></div>'
          + '</div>';

        if (tc.testPriorities.length > 0) {
          html += '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:6px;">Prioridades para testar</div>'
            + '<div style="display:flex;flex-direction:column;gap:4px;">';
          tc.testPriorities.forEach((id, i) => {
            const mod = REPORT.current.modules.find(m => m.id === id);
            const name = mod ? mod.name : id;
            html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#0a0f1a;border:1px solid #0f172a;border-radius:6px;cursor:pointer;" onclick="selectModuleById(\\''+id+'\\')\">'
              + '<span style="font-size:10px;font-weight:700;color:#334155;width:16px;text-align:center;">'+(i+1)+'</span>'
              + '<span style="font-size:12px;color:#64748b;flex:1;">'+esc(name)+'</span>'
              + '<span style="font-size:10px;color:#ef4444;">✗</span>'
              + '</div>';
          });
          html += '</div>';
        }
      }
      html += '</div>';

      // ── Anti-patterns block ──
      html += '<div>'
        + '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:10px;">Anti-Patterns Detectados</div>';

      if (aps.length === 0) {
        html += '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:8px;padding:14px;text-align:center;">'
          + '<div style="font-size:13px;font-weight:600;color:#10b981;">Nenhum anti-pattern detectado</div>'
          + '</div>';
      } else {
        const byName = aps.reduce((acc, ap) => { (acc[ap.name] = acc[ap.name]||[]).push(ap); return acc; }, {});
        html += '<div style="display:flex;flex-direction:column;gap:8px;">';
        Object.entries(byName).forEach(([name, items]) => {
          const sev = items[0].severity;
          html += '<div style="background:'+AP_BG[sev]+';border:1px solid '+AP_COLOR[sev]+'22;border-radius:8px;padding:11px;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
              + '<span class="ap-tag" style="color:'+AP_COLOR[sev]+';border:1px solid '+AP_COLOR[sev]+'33;background:transparent;">'+esc(AP_LABEL[name]||name)+'</span>'
              + '<span style="font-size:10px;color:'+AP_COLOR[sev]+';font-weight:600;">'+items.length+'x '+sev+'</span>'
            + '</div>'
            + '<div style="display:flex;flex-direction:column;gap:4px;">';
          items.forEach(ap => {
            const mod = REPORT.current.modules.find(m => m.id === ap.moduleId);
            html += '<div style="cursor:pointer;padding:4px 0;" onclick="selectModuleById(\\''+ap.moduleId+'\\')\">'
              + '<span style="font-size:11px;font-weight:600;color:#94a3b8;">'+(mod?esc(mod.name):ap.moduleId)+': </span>'
              + '<span style="font-size:11px;color:#64748b;">'+esc(ap.description)+'</span>'
              + '</div>';
          });
          html += '</div></div>';
        });
        html += '</div>';
      }
      html += '</div>';

      // ── Module scores block ──
      if (scores.length > 0) {
        const sorted = [...scores].sort((a, b) => a.score - b.score);
        html += '<div>'
          + '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:10px;">Scores por Módulo</div>'
          + '<div style="display:flex;flex-direction:column;gap:5px;">';
        sorted.forEach(ms => {
          const mod = REPORT.current.modules.find(m => m.id === ms.moduleId);
          const name = mod ? mod.name : ms.moduleId;
          html += '<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="selectModuleById(\\''+ms.moduleId+'\\')\">'
            + '<span style="font-size:12px;color:#64748b;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(name)+'</span>'
            + '<div class="score-bar-track" style="width:80px;flex:none;"><div class="score-bar-fill" style="width:'+ms.score+'%;background:'+sColor(ms.score)+'"></div></div>'
            + '<span style="font-size:11px;font-weight:700;color:'+sColor(ms.score)+';width:26px;text-align:right;">'+ms.score+'</span>'
            + '</div>';
        });
        html += '</div></div>';
      }

      panel.innerHTML = html;
    }

    // ── Decisões panel ───────────────────────────────────────────────────────
    function renderDecisoes() {
      const panel = document.getElementById('panel-decisoes');
      const items = REPORT.decisions || [];
      if (items.length === 0) {
        panel.innerHTML = '<div style="font-size:13px;color:#334155;text-align:center;margin-top:24px;">Nenhuma decisão arquitetural registrada.</div>';
        return;
      }
      let html = '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:4px;">Decisões Arquiteturais</div>'
        + '<p style="font-size:12px;color:#475569;line-height:1.5;margin-bottom:12px;">Por que cada escolha foi feita e quais os trade-offs.</p>'
        + '<div style="display:flex;flex-direction:column;gap:12px;">';
      items.forEach(d => {
        html += '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:10px;padding:13px;">'
          + '<div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:5px;">'+esc(d.title)+'</div>'
          + '<p style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:10px;">'+esc(d.description)+'</p>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
            + '<div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:7px;padding:9px;">'
              + '<div style="font-size:10px;font-weight:700;color:#10b981;margin-bottom:5px;">PRÓS</div>'
              + '<ul style="list-style:none;display:flex;flex-direction:column;gap:3px;">'
              + (d.pros||[]).map(p => '<li style="font-size:11px;color:#64748b;display:flex;gap:5px;"><span style="color:#10b981;flex-shrink:0;">+</span>'+esc(p)+'</li>').join('')
              + '</ul></div>'
            + '<div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.12);border-radius:7px;padding:9px;">'
              + '<div style="font-size:10px;font-weight:700;color:#ef4444;margin-bottom:5px;">CONTRAS</div>'
              + '<ul style="list-style:none;display:flex;flex-direction:column;gap:3px;">'
              + (d.cons||[]).map(c => '<li style="font-size:11px;color:#64748b;display:flex;gap:5px;"><span style="color:#ef4444;flex-shrink:0;">−</span>'+esc(c)+'</li>').join('')
              + '</ul></div>'
          + '</div>'
          + ((d.alternatives||[]).length ? '<div style="margin-top:8px;"><div style="font-size:10px;font-weight:700;color:#475569;margin-bottom:4px;">ALTERNATIVAS</div>'
            + '<div style="display:flex;flex-wrap:wrap;gap:4px;">'
            + (d.alternatives||[]).map(a => '<span style="font-size:11px;background:#0f172a;border:1px solid #1e293b;border-radius:4px;padding:2px 8px;color:#475569;">'+esc(a)+'</span>').join('')
            + '</div></div>' : '')
          + '</div>';
      });
      html += '</div>';
      panel.innerHTML = html;
    }

    // ── Roadmap panel ─────────────────────────────────────────────────────────
    function renderRoadmap() {
      const panel = document.getElementById('panel-roadmap');
      const phases = (REPORT.roadmap || []).slice().sort((a, b) => a.phase - b.phase);
      if (phases.length === 0) {
        panel.innerHTML = '<div style="font-size:13px;color:#334155;text-align:center;margin-top:24px;">Nenhum roadmap gerado.</div>';
        return;
      }
      let html = '<div style="font-size:10px;color:#1e293b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:4px;">Roadmap de Implementação</div>'
        + '<p style="font-size:12px;color:#475569;line-height:1.5;margin-bottom:12px;">Fases sugeridas para implementar a arquitetura de forma incremental.</p>'
        + '<div style="display:flex;flex-direction:column;gap:10px;">';
      const PHASE_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#a855f7'];
      phases.forEach((ph, i) => {
        const color = PHASE_COLORS[i % PHASE_COLORS.length];
        const mods = (ph.modules||[]).map(id => {
          const m = (REPORT.suggested.modules||[]).find(x => x.id === id);
          return m ? m.name : id;
        });
        html += '<div style="background:#0a0f1a;border:1px solid #0f172a;border-radius:10px;padding:13px;">'
          + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">'
            + '<div style="width:24px;height:24px;border-radius:6px;background:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#fff;">'+ph.phase+'</div>'
            + '<div style="flex:1;">'
              + '<div style="font-size:13px;font-weight:600;color:#e2e8f0;">'+esc(ph.title)+'</div>'
              + '<div style="font-size:11px;color:#475569;">'+esc(ph.duration)+'</div>'
            + '</div>'
          + '</div>'
          + '<p style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:8px;">'+esc(ph.description)+'</p>'
          + '<ul style="list-style:none;display:flex;flex-direction:column;gap:4px;margin-bottom:'+(mods.length?'8px':'0')+'">'
          + (ph.items||[]).map(it => '<li style="font-size:12px;color:#64748b;display:flex;gap:6px;"><span style="color:'+color+';flex-shrink:0;font-weight:700;">→</span>'+esc(it)+'</li>').join('')
          + '</ul>'
          + (mods.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;">'
            + mods.map(n => '<span style="font-size:11px;background:'+color+'18;border:1px solid '+color+'33;border-radius:4px;padding:2px 8px;color:'+color+';">'+esc(n)+'</span>').join('')
            + '</div>' : '')
          + '</div>';
      });
      html += '</div>';
      panel.innerHTML = html;
    }

    function selectModuleById(id) {
      const mod = getMicroModules().find(m => m.id === id) || REPORT.current.modules.find(m => m.id === id);
      if (!mod) return;
      silentNav = true; switchTab('current'); silentNav = false;
      selectModule(mod);
    }

    // ── Changes panel ─────────────────────────────────────────────────────────
    function renderChanges() {
      document.getElementById('changes-count').textContent = String(REPORT.suggested.changes.length);
      const list = document.getElementById('changes-list');
      list.innerHTML = '';
      REPORT.suggested.changes.forEach(ch => {
        const card = document.createElement('div');
        card.style.cssText = 'width:272px;flex-shrink:0;background:#0a0f1a;border:1px solid #0f172a;border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:7px;';
        const mods = (ch.affectedModules||[]).map(m =>
          '<span style="font-size:11px;background:#0f172a;color:#475569;padding:2px 7px;border-radius:4px;font-family:monospace;">'+esc(m)+'</span>'
        ).join('');
        card.innerHTML =
          '<div style="display:flex;align-items:center;gap:7px;">'
            +'<span style="font-size:13px;">'+chIcon(ch.type)+'</span>'
            +'<span style="font-size:11px;font-weight:700;color:'+iColor(ch.impact)+';">'+ch.impact.toUpperCase()+'</span>'
            +'<span style="font-size:11px;color:#1e293b;font-family:monospace;">'+ch.type+'</span>'
          +'</div>'
          +'<p style="font-size:13px;color:#e2e8f0;font-weight:500;line-height:1.4;">'+esc(ch.description)+'</p>'
          +'<p style="font-size:12px;color:#475569;line-height:1.4;">'+esc(ch.reason)+'</p>'
          +(mods?'<div style="display:flex;flex-wrap:wrap;gap:4px;">'+mods+'</div>':'');
        list.appendChild(card);
      });
    }

    function toggleChanges() {
      changesOpen = !changesOpen;
      document.getElementById('changes-body').style.display = changesOpen ? 'block':'none';
      document.getElementById('changes-arrow').textContent = changesOpen ? '▾':'▸';
    }

    // ── Written report ────────────────────────────────────────────────────────
    let writtenMode = false;
    let writtenRendered = false;

    function toggleWrittenReport() {
      writtenMode = !writtenMode;
      const overlay = document.getElementById('written-report');
      const btn     = document.getElementById('btn-written');
      overlay.style.display = writtenMode ? 'block' : 'none';
      btn.style.color       = writtenMode ? '#a5b4fc' : '#475569';
      btn.style.borderColor = writtenMode ? 'rgba(99,102,241,.4)' : '#1e293b';
      btn.style.background  = writtenMode ? 'rgba(99,102,241,.15)' : '#0f172a';
      if (writtenMode && !writtenRendered) { renderWrittenReport(); writtenRendered = true; }
    }

    function wrSec(title, body, icon) {
      return '<div style="margin-bottom:44px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #0f172a;">'
        + (icon ? '<span style="font-size:16px;">'+icon+'</span>' : '')
        + '<h2 style="font-size:17px;font-weight:700;color:#e2e8f0;letter-spacing:-.02em;margin:0;">'+esc(title)+'</h2>'
        + '</div>'
        + body
        + '</div>';
    }

    function wrCard(content, borderColor) {
      return '<div style="background:#080d1a;border:1px solid '+(borderColor||'#0f172a')+';border-radius:10px;padding:18px 20px;margin-bottom:12px;">'+content+'</div>';
    }

    function wrLabel(text) {
      return '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#334155;margin-bottom:7px;">'+esc(text)+'</div>';
    }

    function wrProse(text) {
      return '<p style="font-size:14px;color:#64748b;line-height:1.75;margin:0;">'+esc(text)+'</p>';
    }

    function wrBullets(items, color) {
      if (!items || !items.length) return '';
      return '<ul style="list-style:none;display:flex;flex-direction:column;gap:5px;margin:0;padding:0;">'
        + items.map(it => '<li style="display:flex;gap:8px;font-size:13px;color:#64748b;line-height:1.55;">'
          + '<span style="color:'+(color||'#6366f1')+';flex-shrink:0;margin-top:2px;">›</span>'
          + esc(it)+'</li>').join('')
        + '</ul>';
    }

    function wrScoreBar(label, value, color) {
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
        + '<span style="font-size:12px;color:#475569;width:70px;flex-shrink:0;">'+esc(label)+'</span>'
        + '<div style="flex:1;height:4px;background:#0f172a;border-radius:2px;overflow:hidden;">'
        + '<div style="width:'+value+'%;height:100%;background:'+color+';border-radius:2px;"></div></div>'
        + '<span style="font-size:12px;font-weight:700;color:'+color+';width:30px;text-align:right;">'+value+'</span>'
        + '</div>';
    }

    function renderWrittenReport() {
      const R = REPORT;
      const isSuggest = R.project.type === 'System Design';
      const { cycles } = getCycleData();
      let html = '';

      // ── Document header ──
      const scoreColor = sColor(R.healthScore);
      html += '<div style="border-bottom:2px solid #0f172a;padding-bottom:36px;margin-bottom:48px;">'
        + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:20px;">'
        + '<svg width="18" height="18" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#6366f1"/><path d="M6 11L11 6L16 11L11 16Z" stroke="white" stroke-width="1.5" fill="none"/><circle cx="11" cy="11" r="2" fill="white"/></svg>'
        + '<span style="font-size:12px;color:#475569;font-weight:600;">archlens-ai</span>'
        + '</div>'
        + '<h1 style="font-size:30px;font-weight:800;color:#e2e8f0;letter-spacing:-.04em;margin:0 0 10px;">'+esc(R.project.name)+'</h1>'
        + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;">'
        + '<span style="font-size:13px;color:#475569;">'+esc(R.project.type)+'</span>'
        + '<span style="color:#1e293b;">·</span>'
        + '<span style="font-size:14px;font-weight:700;color:'+scoreColor+';">Health Score: '+R.healthScore+'/100</span>'
        + '<div style="flex:1;max-width:120px;height:4px;background:#0f172a;border-radius:2px;overflow:hidden;">'
        + '<div style="width:'+R.healthScore+'%;height:100%;background:'+scoreColor+';border-radius:2px;"></div></div>'
        + '</div>'
        + ((R.project.techStack||[]).length
          ? '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
            + (R.project.techStack||[]).map(t => '<span style="padding:3px 10px;background:#0f172a;border:1px solid #1e293b;border-radius:6px;font-size:12px;color:#94a3b8;">'+esc(t)+'</span>').join('')
            + '</div>'
          : '')
        + '</div>';

      // ── Executive summary ──
      const summaryParts = [R.project.summary, R.macro.summary].filter(Boolean);
      if (summaryParts.length) {
        html += wrSec('Resumo Executivo', summaryParts.map(s => wrProse(s)).join('<div style="height:10px;"></div>'), '◈');
      }

      // ── Tech stack ──
      if (R.macro.nodes.length) {
        const nodesHtml = R.macro.nodes.map(n => {
          const catColor = CAT_COLOR[n.category] || '#6366f1';
          let body = '<div style="display:flex;align-items:flex-start;gap:12px;">'
            + '<div style="width:3px;flex-shrink:0;border-radius:2px;background:'+catColor+';align-self:stretch;min-height:40px;"></div>'
            + '<div style="flex:1;">'
            + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
            + '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">'+esc(n.name)+'</span>'
            + '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 7px;border-radius:4px;background:'+catColor+'18;color:'+catColor+';">'+(CAT_LABEL[n.category]||n.category)+'</span>'
            + (n.version ? '<span style="font-size:11px;color:#334155;font-family:monospace;">'+esc(n.version)+'</span>' : '')
            + '</div>'
            + (n.description ? '<p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 8px;">'+esc(n.description)+'</p>' : '')
            + ((n.issues||[]).length ? '<div style="margin-bottom:6px;">'+wrLabel('Problemas')+wrBullets(n.issues,'#ef4444')+'</div>' : '')
            + ((n.suggestions||[]).length ? wrLabel('Sugestões')+wrBullets(n.suggestions,'#10b981') : '')
            + '</div></div>';
          return wrCard(body, catColor+'33');
        }).join('');
        html += wrSec('Arquitetura de Sistema', '<p style="font-size:13px;color:#475569;margin:0 0 16px;">'+esc(R.macro.summary||'')+'</p>'+nodesHtml, '⬡');
      }

      // ── Current modules ──
      if (R.current.modules.length) {
        const modsHtml = R.current.modules.map(m => {
          const ms = (R.moduleScores||[]).find(s => s.moduleId === m.id);
          const hc = hColor(m.health);
          let body = '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px;">'
            + '<div>'
            + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">'
            + '<div style="width:8px;height:8px;border-radius:50%;background:'+hc+';flex-shrink:0;"></div>'
            + '<span style="font-size:15px;font-weight:600;color:#e2e8f0;">'+esc(m.name)+'</span>'
            + '</div>'
            + (m.path ? '<div style="font-size:11px;color:#334155;font-family:monospace;">'+esc(m.path)+'</div>' : '')
            + '</div>'
            + (ms ? '<div style="text-align:right;flex-shrink:0;">'
              + '<div style="font-size:22px;font-weight:800;color:'+sColor(ms.score)+';">'+ms.score+'</div>'
              + '<div style="font-size:10px;color:#334155;">score</div>'
              + '</div>' : '')
            + '</div>'
            + (m.description ? '<p style="font-size:13px;color:#64748b;line-height:1.65;margin:0 0 12px;">'+esc(m.description)+'</p>' : '')
            + (ms ? '<div style="margin-bottom:12px;">'
              + wrScoreBar('Coesão',   ms.cohesion||0,  '#10b981')
              + wrScoreBar('Acoplamento', ms.coupling||0, ms.coupling>60?'#ef4444':'#f59e0b')
              + wrScoreBar('Tamanho',  ms.size||0,      '#6366f1')
              + (ms.rationale ? '<p style="font-size:12px;color:#475569;line-height:1.5;margin:8px 0 0;font-style:italic;">'+esc(ms.rationale)+'</p>' : '')
              + '</div>' : '')
            + ((m.responsibilities||[]).length ? '<div style="margin-bottom:10px;">'+wrLabel('Responsabilidades')+wrBullets(m.responsibilities,'#6366f1')+'</div>' : '')
            + ((m.dependencies||[]).length
              ? '<div style="margin-bottom:10px;">'+wrLabel('Depende de')
                + '<div style="display:flex;flex-wrap:wrap;gap:5px;">'
                + m.dependencies.map(d => '<span style="font-size:12px;background:#0f172a;border:1px solid #1e293b;border-radius:5px;padding:2px 9px;color:#94a3b8;font-family:monospace;">'+esc(d)+'</span>').join('')
                + '</div></div>' : '')
            + ((m.issues||[]).length ? '<div style="margin-bottom:10px;">'+wrLabel('Problemas')+wrBullets(m.issues,'#ef4444')+'</div>' : '')
            + ((m.suggestions||[]).length ? wrLabel('Sugestões')+wrBullets(m.suggestions,'#10b981') : '');
          return wrCard(body, hc+'44');
        }).join('');
        const label = isSuggest ? 'Baseline (Arquitetura Ingênua)' : 'Arquitetura Atual';
        html += wrSec(label, (R.current.summary ? '<p style="font-size:13px;color:#475569;margin:0 0 16px;">'+esc(R.current.summary)+'</p>' : '')+modsHtml, '▦');
      }

      // ── Suggested modules ──
      if (R.suggested.modules.length) {
        const sugHtml = R.suggested.modules.map(m => {
          const hc = hColor(m.health);
          let body = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
            + '<div style="width:8px;height:8px;border-radius:50%;background:'+hc+';flex-shrink:0;"></div>'
            + '<span style="font-size:15px;font-weight:600;color:#e2e8f0;">'+esc(m.name)+'</span>'
            + (m.isNew ? '<span style="font-size:10px;font-weight:700;background:rgba(16,185,129,.12);color:#34d399;padding:2px 7px;border-radius:4px;">NOVO</span>' : '')
            + (m.diffStatus==='added'   ? '<span style="font-size:10px;font-weight:700;background:rgba(16,185,129,.12);color:#34d399;padding:2px 7px;border-radius:4px;">+ ADICIONADO</span>' : '')
            + (m.diffStatus==='removed' ? '<span style="font-size:10px;font-weight:700;background:rgba(239,68,68,.12);color:#f87171;padding:2px 7px;border-radius:4px;">− REMOVER</span>' : '')
            + (m.diffStatus==='changed' ? '<span style="font-size:10px;font-weight:700;background:rgba(245,158,11,.12);color:#fbbf24;padding:2px 7px;border-radius:4px;">~ ALTERADO</span>' : '')
            + '</div>'
            + (m.path ? '<div style="font-size:11px;color:#334155;font-family:monospace;margin-bottom:6px;">'+esc(m.path)+'</div>' : '')
            + (m.description ? '<p style="font-size:13px;color:#64748b;line-height:1.65;margin:0 0 10px;">'+esc(m.description)+'</p>' : '')
            + ((m.responsibilities||[]).length ? '<div style="margin-bottom:8px;">'+wrLabel('Responsabilidades')+wrBullets(m.responsibilities,'#6366f1')+'</div>' : '')
            + ((m.dependencies||[]).length
              ? '<div>'+wrLabel('Depende de')
                + '<div style="display:flex;flex-wrap:wrap;gap:5px;">'
                + m.dependencies.map(d => '<span style="font-size:12px;background:#0f172a;border:1px solid #1e293b;border-radius:5px;padding:2px 9px;color:#94a3b8;font-family:monospace;">'+esc(d)+'</span>').join('')
                + '</div></div>' : '');
          return wrCard(body, hc+'44');
        }).join('');
        const changes = R.suggested.changes || [];
        let changesHtml = '';
        if (changes.length) {
          const impactColor = i => i==='high'?'#ef4444':i==='medium'?'#f59e0b':'#10b981';
          changesHtml = '<div style="margin-top:24px;">'+wrLabel('Mudanças Propostas')
            + changes.map(ch => wrCard(
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
              + '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:4px;background:'+impactColor(ch.impact)+'18;color:'+impactColor(ch.impact)+';">'+esc(ch.impact)+'</span>'
              + '<span style="font-size:11px;color:#334155;font-family:monospace;">'+esc(ch.type)+'</span>'
              + '</div>'
              + '<p style="font-size:14px;font-weight:600;color:#e2e8f0;margin:0 0 6px;line-height:1.4;">'+esc(ch.description)+'</p>'
              + '<p style="font-size:13px;color:#64748b;line-height:1.55;margin:0;">'+esc(ch.reason)+'</p>'
            )).join('')
            + '</div>';
        }
        html += wrSec('Arquitetura Proposta', (R.suggested.summary ? '<p style="font-size:13px;color:#475569;margin:0 0 16px;">'+esc(R.suggested.summary)+'</p>' : '')+sugHtml+changesHtml, '⊕');
      }

      // ── Anti-patterns & quality (analyze only) ──
      if (!isSuggest) {
        const aps = R.antiPatterns || [];
        const scores = R.moduleScores || [];
        const tc = R.testCoverage || null;
        if (aps.length || scores.length || tc) {
          let qHtml = '';
          if (aps.length) {
            qHtml += wrLabel('Anti-Patterns Detectados')
              + aps.map(ap => wrCard(
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
                + '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:4px;background:'+(AP_BG[ap.severity]||'#0a0f1a')+';color:'+(AP_COLOR[ap.severity]||'#f59e0b')+';">'+esc(ap.severity)+'</span>'
                + '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">'+(AP_LABEL[ap.type]||esc(ap.type||ap.name||''))+'</span>'
                + '</div>'
                + '<div style="font-size:12px;color:#475569;font-family:monospace;margin-bottom:6px;">'+esc(ap.moduleName||ap.module||'')+'</div>'
                + '<p style="font-size:13px;color:#64748b;line-height:1.55;margin:0;">'+esc(ap.description)+'</p>',
                (AP_COLOR[ap.severity]||'#f59e0b')+'33'
              )).join('');
          }
          if (scores.length) {
            const sorted = [...scores].sort((a,b) => a.score - b.score);
            qHtml += '<div style="margin-top:20px;">'+wrLabel('Scores por Módulo')
              + sorted.map(ms => '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #0a0f1e;">'
                + '<span style="font-size:13px;color:#64748b;flex:1;">'+esc(ms.moduleId)+'</span>'
                + '<div style="width:120px;height:4px;background:#0f172a;border-radius:2px;overflow:hidden;">'
                + '<div style="width:'+ms.score+'%;height:100%;background:'+sColor(ms.score)+';border-radius:2px;"></div></div>'
                + '<span style="font-size:12px;font-weight:700;color:'+sColor(ms.score)+';width:28px;text-align:right;">'+ms.score+'</span>'
                + '</div>').join('')
              + '</div>';
          }
          if (tc && tc.testFilesFound > 0) {
            qHtml += '<div style="margin-top:20px;">'+wrLabel('Cobertura de Testes')
              + wrCard('<div style="display:flex;gap:20px;margin-bottom:12px;">'
                + '<div><div style="font-size:22px;font-weight:800;color:'+sColor(tc.coverageScore)+';">'+tc.coverageScore+'%</div><div style="font-size:10px;color:#334155;">score</div></div>'
                + '<div><div style="font-size:22px;font-weight:800;color:#e2e8f0;">'+tc.coveredModules.length+'</div><div style="font-size:10px;color:#334155;">cobertos</div></div>'
                + '<div><div style="font-size:22px;font-weight:800;color:#e2e8f0;">'+tc.uncoveredModules.length+'</div><div style="font-size:10px;color:#334155;">sem testes</div></div>'
                + '</div>'
                + ((tc.testPriorities||[]).length ? wrLabel('Prioridades')+wrBullets(tc.testPriorities,'#f59e0b') : ''))
              + '</div>';
          }
          html += wrSec('Qualidade & Anti-Patterns', qHtml, '⚡');
        }
      }

      // ── Cycles (analyze only) ──
      if (!isSuggest && cycles.length) {
        const cycHtml = cycles.map(c => wrCard(
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;">'
          + c.map((id,i) => '<span style="font-size:12px;padding:3px 10px;border-radius:6px;background:'+(i===c.length-1?'rgba(239,68,68,.12)':'#0f172a')+';border:1px solid '+(i===c.length-1?'rgba(239,68,68,.3)':'#1e293b')+';color:'+(i===c.length-1?'#fca5a5':'#94a3b8')+';">'+esc(id)+'</span>'+(i<c.length-1?'<span style="color:#334155;">→</span>':'')).join('')
          + '</div>'
          + '<p style="font-size:13px;color:#64748b;line-height:1.55;margin:0;">Refatore extraindo uma interface ou serviço compartilhado que ambos os módulos dependam, eliminando a referência circular direta.</p>',
          'rgba(239,68,68,.2)'
        )).join('');
        html += wrSec('Dependências Circulares', cycHtml, '↺');
      }

      // ── Decisions (suggest only) ──
      if (isSuggest && (R.decisions||[]).length) {
        const decHtml = R.decisions.map(d => wrCard(
          '<div style="margin-bottom:10px;">'
          + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#10b981;margin-bottom:6px;">✓ decidido</div>'
          + '<h3 style="font-size:15px;font-weight:700;color:#e2e8f0;margin:0 0 6px;">'+esc(d.title)+'</h3>'
          + '<p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">'+esc(d.description)+'</p>'
          + '</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:10px;">'
          + '<div>'+wrLabel('Prós')+wrBullets(d.pros,'#10b981')+'</div>'
          + '<div>'+wrLabel('Contras')+wrBullets(d.cons,'#ef4444')+'</div>'
          + '</div>'
          + wrLabel('Alternativas Consideradas')+wrBullets(d.alternatives,'#6366f1'),
          'rgba(16,185,129,.15)'
        )).join('');
        html += wrSec('Decisões Arquiteturais', decHtml, '◉');
      }

      // ── Roadmap (suggest only) ──
      if (isSuggest && (R.roadmap||[]).length) {
        const PHASE_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#a855f7'];
        const roadHtml = R.roadmap.map((ph, i) => {
          const color = PHASE_COLORS[i % PHASE_COLORS.length];
          const mods = (ph.modules||[]).map(id => { const m=(R.suggested.modules||[]).find(x=>x.id===id); return m?m.name:id; });
          return wrCard(
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
            + '<div style="width:32px;height:32px;border-radius:8px;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0;">'+ph.phase+'</div>'
            + '<div><div style="font-size:15px;font-weight:700;color:#e2e8f0;">'+esc(ph.title)+'</div><div style="font-size:12px;color:#475569;">'+esc(ph.duration)+'</div></div>'
            + '</div>'
            + '<p style="font-size:13px;color:#64748b;line-height:1.65;margin:0 0 12px;">'+esc(ph.description)+'</p>'
            + wrBullets(ph.items, color)
            + (mods.length ? '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:12px;">'
              + mods.map(n=>'<span style="font-size:11px;padding:2px 9px;border-radius:5px;background:'+color+'18;border:1px solid '+color+'30;color:'+color+';">'+esc(n)+'</span>').join('')
              + '</div>' : ''),
            color+'33'
          );
        }).join('');
        html += wrSec('Roadmap de Implementação', roadHtml, '→');
      }

      document.getElementById('written-content').innerHTML = html;
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
      const sc = REPORT.healthScore;
      document.getElementById('hdr-score').style.color = sColor(sc);
      document.getElementById('hdr-bar').style.background = sColor(sc);

      const isSuggest = REPORT.project.type === 'System Design';

      // Show/hide tabs based on mode
      document.getElementById('tab-ciclos').style.display    = isSuggest ? 'none' : '';
      document.getElementById('tab-qualidade').style.display = isSuggest ? 'none' : '';
      document.getElementById('tab-decisoes').style.display  = isSuggest ? '' : 'none';
      document.getElementById('tab-roadmap').style.display   = isSuggest ? '' : 'none';

      initCy();

      if (isSuggest) {
        // Suggest mode: start on Sugerido tab
        switchTab('suggested');
      } else {
        // Analyze mode: start on Sistema tab + pre-compute badges
        const { cycles } = getCycleData();
        if (cycles.length > 0) {
          const badge = document.getElementById('cycles-badge');
          badge.textContent = String(cycles.length);
          badge.style.display = 'flex';
          badge.style.background = '#ef4444';
        }
        const apCount = (REPORT.antiPatterns||[]).length;
        if (apCount > 0) {
          const apBadge = document.getElementById('ap-badge');
          apBadge.textContent = String(apCount);
          apBadge.style.display = 'flex';
          const hasHigh = (REPORT.antiPatterns||[]).some(a => a.severity === 'high');
          apBadge.style.background = hasHigh ? '#ef4444' : '#f59e0b';
        }
        switchTab('sistema');
      }

      renderChanges();
    }

    window.addEventListener('load', init);
  </script>
</body>
</html>`
}
