# Archlens — Roadmap

## Análise

- **Comparação entre commits** — rodar em dois SHAs diferentes e mostrar como a arquitetura evoluiu: módulos adicionados, removidos, health score antes/depois
- **Métricas de complexidade** — ciclomática, linhas por módulo, profundidade de herança; exibir como heat-map no grafo
- **Análise de superfície de API** — listar endpoints expostos por módulo, detectar rotas sem autenticação ou sem validação de entrada
- **Impacto de mudança** — dado um arquivo ou módulo, calcular quais outros módulos são afetados (fan-out inverso)
- **Dead code via AST** — complementar a detecção por IA com análise estática real de exportações não importadas
- **Churn correlation** — cruzar frequência de mudança (git log) com health score; módulos que mudam muito e têm score baixo têm prioridade máxima
- **Licença e compliance** — escanear dependências e alertar sobre conflitos de licença (GPL em projeto proprietário, etc.)
- **Análise de bundle** — para projetos frontend, estimar tamanho de cada módulo no bundle e identificar heavy importers

---

## Relatório

- **Exportar como PDF** — botão no HTML que usa `window.print()` com CSS de impressão otimizado
- **Exportar diagrama como PNG/SVG** — botão para salvar o grafo Cytoscape como imagem
- **Modo de apresentação** — tela cheia com fonte maior para mostrar em reuniões e code reviews
- **Compartilhamento** — opção `--upload` que sobe o HTML para S3/Gist e retorna URL pública
- **Resumo executivo** — seção colapsável no topo com 3–5 bullets de alto nível para quem não vai explorar o grafo todo
- **Changelog de arquitetura** — ao rodar múltiplas vezes no mesmo projeto, gerar histórico de como o score e os módulos mudaram ao longo do tempo
- **Side-by-side diff** — visualização em duas colunas de estado atual vs. sugerido, com setas de migração entre eles
- **Anotações** — permitir que o usuário adicione comentários/notas em módulos diretamente no HTML, salvos em `localStorage`

---

## Integração

- **Watch mode** — `archlens --watch` que detecta mudanças no projeto e re-analisa automaticamente, atualizando o browser via WebSocket
- **CI/CD integration** — modo `--ci` que retorna JSON estruturado com score, anti-patterns e ciclos para consumo por outras ferramentas
- **GitHub Action** — action pronta que roda archlens em PRs e posta o relatório como comment com o diff de arquitetura
- **VS Code extension** — painel lateral dentro do editor que exibe o relatório sem precisar abrir o browser
- **Slash command no Claude Code** — `/archlens` roda direto na sessão atual sem sair do terminal
- **MCP server** — expor as análises como tools para que o Claude Code possa chamar durante uma conversa
- **Pre-commit hook** — rodar `archlens --min-score` automaticamente antes de cada commit e bloquear se o score cair

---

## UX / Navegação

- **Filtro por health** — botão para mostrar apenas nós `critical` ou `warning` no grafo
- **Agrupamento por domínio** — deixar o usuário arrastar módulos para criar grupos visuais nomeados, persistidos em `.archlens.json`
- **Teclado** — navegação por setas entre módulos, `Esc` para voltar, `/` para focar search
- **Mini-mapa** — overview do grafo inteiro no canto inferior quando há muitos nós
- **Dark/light mode** — toggle de tema com persistência em `localStorage`
- **Zoom para módulo** — duplo clique num nó centraliza e aplica zoom suave, em vez de mover o painel lateral

---

## Qualidade Técnica

- **Cache de análise** — salvar o resultado em `.archlens-cache/` usando hash do projeto; re-usar se os arquivos não mudaram
- **Retry automático** — se o Claude retornar JSON inválido, tentar novamente com prompt de correção antes de falhar
- **Testes de snapshot** — testes que salvam o HTML gerado e alertam sobre regressões visuais
- **Streaming de resposta** — usar a API de streaming do Claude para mostrar progresso real da análise em vez de esperar o JSON completo
- **Análise incremental** — re-analisar apenas módulos cujos arquivos mudaram desde o último run
- **Score histórico** — persistir scores em `.archlens-cache/history.json` e exibir gráfico de tendência no relatório

---

## Implementado

- **Diagrama estilo enterprise** — nós agrupados em containers com borda tracejada por categoria (FRAMEWORKS, DATABASES, etc.) no grafo macro
- **UX do grafo** — busca em tempo real, breadcrumb de navegação, tooltip no hover, highlight de vizinhos, arestas coloridas por protocolo, layouts alternativos (força/árvore/anel), aba de dependências circulares com badge
- **`archlens suggest <descrição>`** — modo greenfield: o usuário descreve um problema e o Archlens gera uma arquitetura proposta completa (macro + módulos + decisões de design) sem precisar de código existente
- **`.archlens.json`** — configuração por projeto: pastas a ignorar, profundidade, minScore, idioma e perfil
- **`--profile security|performance|architecture`** — foca o prompt de análise em preocupações específicas com instruções detalhadas para cada perfil
- **`--lang pt|en|es`** — conteúdo gerado pela IA no idioma escolhido
- **`--depth shallow|deep`** — modo deep lê conteúdo parcial dos arquivos principais e inclui no contexto do prompt
- **`--monorepo`** — detecta workspaces (packages/, apps/, services/), analisa cada um e gera relatório index consolidado com dashboard de health scores
- **`--min-score <n>`** — sai com código 1 se o health score ficar abaixo do threshold (útil em CI)
- **Validação de schema com Zod** — schemas em `src/analyzer/schemas.ts`, erros com path e mensagem exata
- **Progress bar real** — barra `[████████░░░░] 87/200` no terminal durante o scan de arquivos; degrada gracefully em ambientes sem TTY
- **Detecção de anti-patterns** — God Class, Feature Envy, Shotgun Surgery, Data Clump, Dead Code, Primitive Obsession; badge com contagem na aba Qualidade
- **Score por módulo** — score 0-100 com breakdown coesão/independência/tamanho; visível nas linhas da lista e com barras no detalhe do módulo
- **Cobertura de testes** — scanner detecta `*.test.*` / `*.spec.*` / `__tests__/`; correlaciona com módulos e rankeia prioridades; aba Qualidade mostra score e lista de não testados
