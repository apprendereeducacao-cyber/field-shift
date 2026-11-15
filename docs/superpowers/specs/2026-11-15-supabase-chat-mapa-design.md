# Field Shift — Supabase + Chat AI + Mapa Layers

## Intent

Transformar o Field Shift de um dashboard estatico (JSONs no build) em uma plataforma viva:
dados no Supabase acessiveis de qualquer lugar, chat AI que cruza dados cientificos com a realidade
do produtor para recomendar estrategias de rotacao, e mapa com layers empilaveis.

### Why

O hackathon NASA Space Apps exige demonstracao de plataforma funcional. Um chat AI que
conversa com o produtor sobre seus dados reais diferencia o Field Shift de qualquer dashboard
estatico. O Supabase como fundacao permite que os dados sejam atualizados sem deploy e que
o chat tenha context query real.

### Who

Produtores rurais do RS que querem saber qual rotacao de culturas e plantas de cobertura e
melhor para sua propriedade. Sem login — entra e conversa direto.

---

## Goals

1. Todos os 18 datasets migrados para Supabase em tabelas normalizadas
2. Chat AI na homepage estilo ChatGPT — Claude como inteligencia, Supabase como memoria
3. Chat faz perguntas simples ao produtor e propoe estrategia de rotacao personalizada
4. Mapa com layers empilaveis (checkbox + slider de opacidade)
5. Zero friccao: sem login, sem cadastro

## Non-goals

- Auth/login (futuro)
- Dashboard admin para gerenciar dados
- Upload de arquivos pelo produtor
- Integracao com APIs de satelite em tempo real (os dados sao atualizados via pipeline offline)

## Anti-goals

- Chat generico que responde qualquer coisa — ele deve ser especialista em rotacao de culturas
  para Cruz Alta/RS usando nossos dados NASA
- Over-engineering: nao criar microservices, nao separar frontend/backend em repos diferentes

---

## Constraints

- Supabase Free Tier (500MB DB, 1GB storage, 50K MAU)
- Claude API key no server-side (nunca exposta ao client)
- Next.js 16.4.6 (App Router) — API routes em `app/api/`
- ~436KB de dados cientificos — cabe no context window do Claude (200K tokens)
- Leaflet no mapa (ja instalado)
- Sem dependencia nova alem de `@supabase/supabase-js` e `@anthropic-ai/sdk`

---

## Approaches Considered

### A) Full Supabase — dados cientificos + produtor em tabelas normalizadas (ESCOLHIDA)

Todos os 18 JSONs migrados para ~12 tabelas. Chat consulta via SQL as tabelas relevantes
para montar context. Dados do produtor (sessao anonima + historico de chat) tambem no Supabase.

- Pro: plataforma real, dados atualizaveis sem deploy, queries flexiveis
- Pro: futuro-proof — adicionar novas regioes e inserir rows, nao novo deploy
- Contra: mais trabalho inicial de modelagem
- Contra: ~436KB de dados que mudam raramente agora vivem no DB

### B) Hibrido — JSONs como context blob + Supabase so para produtor

Os dados cientificos ficam como JSONs, so os dados do produtor vao pro Supabase.

- Pro: menos trabalho
- Contra: atualizar dados exige deploy; nao escala para multiplas regioes

### C) API routes estaticas + Supabase minimo

Mantem JSONs, cria API routes que os servem filtrados.

- Pro: menor mudanca
- Contra: nao e uma plataforma real

**Decisao: A.** Construir a fundacao certa.

---

## Schema Supabase

### Tabelas de Referencia (dados cientificos — Cruz Alta)

```
sites
  id          uuid PK default gen_random_uuid()
  name        text NOT NULL        -- "Cruz Alta"
  state       text NOT NULL        -- "RS"
  lat         double precision
  lon         double precision
  created_at  timestamptz default now()

crops
  id          text PK              -- "soja", "milho", "trigo"...
  name        text NOT NULL
  name_en     text
  season      text                 -- "verao", "inverno", "cobertura"
  plant_months    int[]
  harvest_months  int[]
  cycle_days      int[]
  temp_min    double precision
  temp_opt    double precision[]
  temp_max    double precision
  water_need_mm   double precision[]
  drought_tolerance text
  n_fixing    boolean
  root_depth_cm   int[]
  tags        text[]
  metadata    jsonb                -- campos menos consultados

cover_crops
  id          text PK              -- normalizado: "aveia-preta" -> "aveia_preta"
  name        text NOT NULL
  name_en     text
  scientific  text
  family      text
  group_type  text                 -- "group" e reservado no SQL
  functions   text[]
  sowing_months   int[]
  dry_matter_t_ha double precision[]
  cn_ratio    text
  notes       text[]
  metadata    jsonb

rotation_strategies
  id          text PK              -- "baseline", "conservative", "adaptive"
  site_id     uuid FK -> sites
  name        text NOT NULL
  subtitle    text
  sequence    jsonb                -- [{season, crop}]
  scores      jsonb                -- {soil_health, erosion_control, ...}
  total_score double precision
  evidence    jsonb
  risks       text[]
  benefits    text[]

soil_profiles
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  source      text
  texture_class text
  interpretation jsonb
  layers      jsonb                -- [{depth, clay_pct, sand_pct, ...}]

climate_monthly
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  source      text                 -- "NASA POWER", "SMAP", "GPM", etc.
  dataset     text                 -- "power", "smap", "gpm", "grace", "lst", "et"
  month       int CHECK (1-12)
  name        text                 -- "Jan", "Fev"...
  values      jsonb                -- {avg_rain_mm, avg_tmax_c, ...} varia por dataset
  UNIQUE(site_id, dataset, month)

climate_yearly
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  source      text
  dataset     text
  year        int
  values      jsonb                -- {annual_rain_mm, avg_tmax_c, hot_days, yield_sc_ha, ...}
  UNIQUE(site_id, dataset, year)

climate_timeseries
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  dataset     text                 -- "smap", "gpm", "grace"
  date        date
  year        int
  month       int
  values      jsonb                -- {soil_moisture, precip_mm_month, tws_anomaly_cm, ...}
  UNIQUE(site_id, dataset, date)

topography_points
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  latitude    double precision
  longitude   double precision
  elevation_m double precision

ndvi_data
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  type        text                 -- "monthly_avg", "annual_avg", "tile"
  month       int
  year        int
  values      jsonb                -- {avg_ndvi, avg_evi, tile_url, ndvi_mean, ...}

mapbiomas_data
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  land_use_key text               -- "soja", "floresta", "pastagem"...
  type        text                 -- "current_state", "transition", "timeseries"
  year        int
  values      jsonb                -- {area_ha, pct} ou {from_ha, to_ha, change_pct}

risk_engine
  id          uuid PK default gen_random_uuid()
  site_id     uuid FK -> sites
  data        jsonb                -- o JSON inteiro — consultado por chave
```

### Tabelas de Sessao (dados do produtor/chat)

```
chat_sessions
  id          uuid PK default gen_random_uuid()
  anonymous_id text NOT NULL       -- UUID gerado no browser (localStorage)
  site_id     uuid FK -> sites     -- regiao sendo analisada
  title       text                 -- gerado automaticamente do primeiro prompt
  producer_context jsonb           -- dados que o produtor forneceu (area_ha, culturas, problemas...)
  created_at  timestamptz default now()
  updated_at  timestamptz default now()

chat_messages
  id          uuid PK default gen_random_uuid()
  session_id  uuid FK -> chat_sessions ON DELETE CASCADE
  role        text CHECK (role IN ('user', 'assistant', 'system'))
  content     text NOT NULL
  metadata    jsonb                -- {tokens_used, model, context_tables_queried}
  created_at  timestamptz default now()
```

### Indices

```sql
CREATE INDEX idx_climate_monthly_site_dataset ON climate_monthly(site_id, dataset);
CREATE INDEX idx_climate_yearly_site_dataset ON climate_yearly(site_id, dataset);
CREATE INDEX idx_climate_timeseries_site_dataset ON climate_timeseries(site_id, dataset, date);
CREATE INDEX idx_topography_site ON topography_points(site_id);
CREATE INDEX idx_ndvi_site_type ON ndvi_data(site_id, type);
CREATE INDEX idx_mapbiomas_site ON mapbiomas_data(site_id, land_use_key);
CREATE INDEX idx_chat_sessions_anon ON chat_sessions(anonymous_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

### RLS e Acesso

Todas as tabelas de referencia sao acessadas exclusivamente via API routes server-side
usando a **service role key** do Supabase. O client nunca chama o Supabase diretamente.
Isso significa que RLS e efetivamente bypassed pelo service key — nao e necessario criar
policies para tabelas de referencia.

Para as tabelas de chat (`chat_sessions`, `chat_messages`), tambem acesso server-side via
API routes. O `anonymous_id` e validado na API route, nao via RLS.

### Cleanup de Sessoes

Sessoes anonimas com mais de 30 dias sao purgadas via cron (Supabase pg_cron ou API route
agendada). Isso mantem o DB dentro do free tier.

---

## Chat AI — Arquitetura

### Fluxo

```
[Produtor digita] → POST /api/chat
  → Busca producer_context da sessao
  → Classifica tema da mensagem (keywords simples)
  → Busca dados relevantes do Supabase por tema
  → Monta system prompt + context cientifico + producer_context
  → Chama Claude API (streaming)
  → Stream response de volta ao client
  → Salva mensagens (user + assistant) no Supabase
  → Post-processing: extrai dados do produtor da resposta e atualiza producer_context
```

### Context Pre-montado (decisao)

O servidor decide quais dados incluir no prompt baseado no tema da mensagem.
Nao usa tool use do Claude — uma unica chamada por mensagem, mais rapido e mais barato.

Categorias de context:
- **Sempre incluido**: site summary, soil profile resumido, risk engine current_scenario,
  crops e cover_crops (lista compacta)
- **Tema chuva/clima**: climate_monthly power + gpm, annual_totals, trend
- **Tema solo/umidade**: soil_profiles completo, smap monthly, soil_moisture
- **Tema culturas/rotacao**: crops completo, cover_crops completo, rotation_strategies
- **Tema tendencias/historico**: climate_yearly, timeline, enso_impact
- **Tema vegetacao**: ndvi monthly + annual, mapbiomas current_state

Se o tool use for necessario no futuro, e incremental — adiciona-se tools sem mudar a
arquitetura base.

### System Prompt do Claude

O Claude recebe:
1. **Persona**: Especialista em rotacao de culturas para o RS, fala como agronomo experiente
   que conhece os dados NASA. Tom direto, pratico, sem jargao desnecessario.
2. **Dados do site**: clima, solo, NDVI, risco — pre-carregados do Supabase
3. **Dados do produtor** (se ja fornecidos): area, culturas atuais, problemas
4. **Instrucoes**: fazer perguntas simples ao produtor para entender a situacao dele,
   cruzar com os dados cientificos, e propor a melhor estrategia. Maximo 2-3 perguntas
   por mensagem. Quando tiver dados suficientes, propor estrategia com justificativa
   baseada nos dados NASA.

### Producer Context Update

Quando o Claude faz perguntas e o produtor responde, o servidor faz post-processing
da conversa para extrair dados estruturados:
- area_ha, culturas_atuais, problemas, solo_observado, historico_rotacao, tem_gado, etc.
- Esses dados sao salvos em `chat_sessions.producer_context` (JSONB)
- Nas mensagens seguintes, o Claude recebe esse context atualizado

Implementacao: regex + heuristicas simples no servidor (nao precisa de outro LLM).

### API Routes

```
POST /api/chat
  Body: { session_id?, anonymous_id, message, site_id? }
  Response: SSE stream (text/event-stream)

GET /api/chat/sessions
  Query: { anonymous_id }
  Response: lista de sessoes do usuario anonimo

GET /api/chat/sessions/[id]
  Query: { anonymous_id }
  Response: sessao com mensagens
```

---

## Migracao de Paginas — Estrategia

### Problema

Todas as paginas sao `"use client"` e importam dados estaticamente no module scope.
Exemplo: `const AVAILABLE_YEARS = timeline.timeline.map(...)` no topo de `page.tsx`.
Migrar para async fetching quebra esse pattern.

### Solucao: Server Components com data fetching

Cada pagina migra para server component (remove `"use client"`) que:
1. Busca dados do Supabase no servidor (async)
2. Passa como props para um client component que contem a logica interativa

```
page.tsx (server) → busca dados → <PageClient data={...} /> (client)
```

Isso funciona porque:
- Next.js App Router suporta server components nativamente
- Os dados nao mudam durante a sessao — buscar uma vez no servidor e suficiente
- As constantes derivadas (AVAILABLE_YEARS, etc.) sao computadas no client component
  a partir dos props

### Paginas afetadas

| Pagina | Dados usados | Complexidade |
|--------|-------------|-------------|
| `/` (homepage) | timeline, riskEngine, site, KEY_FINDINGS | Media |
| `/painel` | timeline, riskEngine, rotations, KEY_FINDINGS | Media |
| `/dados` | TUDO (site, timeline, soil, topo, moisture, ndvi, mapbiomas, et, smap, gpm, grace, climate, lst) | Alta — 2685 linhas |
| `/mapa` | ndvi_tiles, topography, site, mapbiomas (importa direto dos JSONs, nao via data.ts) | Media |
| `/produtor` | coverCrops | Baixa |
| `/rotacoes` | crops, coverCrops, rotations, soil, site, riskEngine, ndvi | Media |
| `/recomendacao` | recommendation-engine.ts (usa crops, coverCrops, rotations, etc.) | Media |

### data.ts → lib/supabase-data.ts

O novo `supabase-data.ts` exporta funcoes async que buscam do Supabase:
```ts
export async function getSite(siteId: string): Promise<SiteData> { ... }
export async function getCrops(): Promise<Crop[]> { ... }
export async function getClimateMonthly(siteId: string, dataset: string): Promise<...> { ... }
// etc.
```

Os types continuam no mesmo lugar. O `data.ts` antigo e removido junto com os JSONs em `data/`
apos a migracao estar completa e testada.

A pagina `/mapa` importa direto dos JSONs (nao via data.ts) — sera migrada individualmente.

---

## Mapa — Layers Empilaveis

### Mudancas

| Antes | Depois |
|-------|--------|
| Radio buttons (1 layer por vez) | Checkboxes (multiplas layers) |
| Opacidade fixa | Slider de opacidade por layer (0-100%) |
| `activeLayer: Layer` (string) | `layers: Record<Layer, {visible, opacity}>` |
| Remove todos, adiciona 1 | Cada layer gerencia seu proprio overlay |

### Implementacao

- State: `Record<Layer, { visible: boolean; opacity: number }>`
- Cada layer tem seu proprio ref de overlay
- Toggle: adiciona/remove do mapa sem afetar outros
- Slider: `setOpacity()` no overlay
- Ordem de z-index: relevo (base) → temperatura → ndvi → uso-do-solo (topo)
- UI: cards com checkbox + slider colapsavel por layer
- Alinhamento de bbox/extent: todas as camadas compartilham o mesmo centro e zoom

---

## Ordem de Execucao

### Fase 1 — Supabase Foundation
1. Criar projeto Supabase (ou conectar existente)
2. Rodar migrations: criar todas as tabelas + indices
3. Script de seed: migrar os 18 JSONs para as tabelas
4. Instalar `@supabase/supabase-js`, criar client (service role, server-only)
5. Criar `lib/supabase-data.ts` com funcoes de fetch
6. Criar API routes para servir dados: `/api/data/[dataset]`
7. Migrar cada pagina: server component + client component
8. Migrar `/mapa` separadamente (importa direto dos JSONs)
9. Verificar que todas as paginas funcionam com dados do Supabase
10. Remover JSONs de `data/` e `data.ts` antigo

### Fase 2 — Chat AI
1. Instalar `@anthropic-ai/sdk`
2. Criar tabelas de chat (sessions + messages) via migration
3. Criar system prompt com persona e instrucoes
4. Criar API route `/api/chat` com streaming SSE
5. Implementar classificacao de tema e context assembly
6. Componente de chat na homepage (estilo ChatGPT)
7. Historico de conversas (por anonymous_id via localStorage)
8. Post-processing para extrair producer_context

### Fase 3 — Mapa Layers
1. Converter state de radio para multi-select
2. Gerenciar overlays independentes por layer
3. Adicionar sliders de opacidade
4. Alinhar bbox/extent de todas as camadas
5. UI refinada com cards colapsaveis

---

## Builder Calls (decisoes tecnicas minhas, nao do usuario)

- **JSONB vs tabelas separadas para climate data**: Unificado em climate_monthly,
  climate_yearly e climate_timeseries com coluna `dataset` e `values jsonb`.
  O pattern e identico entre datasets — so os campos dentro de `values` mudam.

- **Topography como tabela de pontos**: 2.346 rows em vez de JSONB blob.
  Permite queries espaciais futuras.

- **Risk engine como JSONB blob**: Complexo demais para normalizar. Fica como
  documento consultavel por chaves.

- **Cover crops ID normalization**: `aveia-preta` → `aveia_preta` no seed script.

- **Context pre-montado vs tool use**: Pre-montado (servidor classifica tema e
  busca dados relevantes). Uma chamada ao Claude por mensagem. Tool use e
  incremental se precisar no futuro.

- **Server components para data fetching**: Paginas migram de `"use client"` com
  imports estaticos para server component que busca + client component interativo.

- **Acesso Supabase via service key server-side only**: Client nunca chama Supabase
  direto. Simplifica seguranca — sem RLS policies.

- **Sessoes anonimas com TTL 30 dias**: pg_cron ou API route agendada para purge.

- **NDVI tile URLs**: Armazenados como estao (GEE endpoints). Se expirarem, o
  pipeline de dados re-gera. Nao e responsabilidade da plataforma web.
