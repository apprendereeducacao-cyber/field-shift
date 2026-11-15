# Field Shift — Supabase + Chat AI + Mapa Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Field Shift from static JSON imports to a Supabase-backed platform with an AI chat for crop rotation advice and a stackable map layer system.

**Architecture:** All 18 JSON datasets migrate to ~12 Supabase tables. Pages become server components that fetch data and pass to client components. A streaming chat API route connects the producer to Claude, which uses pre-assembled scientific context from Supabase. The map gains multi-layer support with per-layer opacity.

**Tech Stack:** Next.js 16.4.6 (App Router), Supabase (PostgreSQL), Claude API (`@anthropic-ai/sdk`), Leaflet, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-11-15-supabase-chat-mapa-design.md`

## Global Constraints

- Supabase Free Tier: 500MB DB, 1GB storage, 50K MAU
- Claude API key server-side only (env var `ANTHROPIC_API_KEY`)
- Supabase service role key server-side only (env var `SUPABASE_SERVICE_ROLE_KEY`)
- Supabase anon key for client-side reads is NOT used — all access via API routes
- No new dependencies beyond `@supabase/supabase-js` and `@anthropic-ai/sdk`
- Zero emojis in UI text
- All text in Portuguese (pt-BR), domain-specific to agriculture
- Next.js 16 route handlers use Web Request/Response API, params is a Promise

## Review Focus

1. **Anonymous ID spoofing**: A user could fabricate an `anonymous_id` to read another user's chat history. The `/api/chat/sessions` endpoint must validate that the anonymous_id from the request matches sessions owned by that ID — but since there's no auth, the only protection is obscurity (UUID v4). Acceptable for now, but the API must never return sessions without an anonymous_id filter.
2. **Claude API key leak in client bundle**: Any file importing `@anthropic-ai/sdk` or referencing `ANTHROPIC_API_KEY` must be in a route handler (`route.ts`) or server-only module, never in a `"use client"` file or a file imported by one.
3. **Supabase service key in client bundle**: Same as above — `SUPABASE_SERVICE_ROLE_KEY` and the admin client must never be importable from client components. The `lib/supabase.ts` file must use `import "server-only"`.
4. **SSE stream not closing on client disconnect**: The `/api/chat` streaming endpoint must abort the Claude API call when the client disconnects, to avoid wasting tokens.
5. **Empty state on first visit**: A new visitor has no `anonymous_id` yet. The chat component must generate one on mount and persist to localStorage before the first message. All API calls must handle the case where no sessions exist gracefully.

---

## File Structure

### New files to create

```
src/lib/supabase.ts              — Supabase admin client (server-only)
src/lib/supabase-data.ts         — Async data-fetching functions from Supabase
src/lib/chat-context.ts          — Chat context assembly (topic classification + data selection)
src/lib/types.ts                 — All shared types (extracted from data.ts)

src/app/api/chat/route.ts        — POST: streaming chat, GET: not used
src/app/api/chat/sessions/route.ts       — GET: list sessions for anonymous_id
src/app/api/chat/sessions/[id]/route.ts  — GET: session with messages

src/components/Chat.tsx           — Chat UI component (client)
src/components/ChatHistory.tsx    — Chat session list sidebar (client)

scripts/seed.ts                   — Seed script: reads JSONs, inserts into Supabase
supabase/migrations/001_schema.sql — All table definitions + indices
```

### Files to modify

```
src/app/page.tsx                  — Split to server+client, add Chat component
src/app/painel/page.tsx           — Split to server+client
src/app/dados/page.tsx            — Split to server+client
src/app/mapa/page.tsx             — Split to server+client, convert to multi-layer
src/app/rotacoes/page.tsx         — Split to server+client
src/app/recomendacao/page.tsx     — Split to server+client
src/app/produtor/page.tsx         — Split to server+client

src/lib/recommendation-engine.ts  — Accept data as parameters instead of importing
```

### Files to remove (after full migration verified)

```
src/lib/data.ts                   — Replaced by supabase-data.ts + types.ts
data/*.json (18 files)            — All data now in Supabase
```

---

### Task 1: Supabase Setup + Schema Migration

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `src/lib/supabase.ts`
- Modify: `package.json` (add `@supabase/supabase-js`)

**Interfaces:**
- Consumes: nothing
- Produces: `createAdminClient(): SupabaseClient` from `src/lib/supabase.ts`; all 14 tables in Supabase

- [ ] **Step 1: Install `@supabase/supabase-js`**

Run: `cd app/web && npm install @supabase/supabase-js`

- [ ] **Step 2: Create `src/lib/supabase.ts` — server-only admin client**

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 3: Write `supabase/migrations/001_schema.sql`**

All 14 tables as defined in the spec: `sites`, `crops`, `cover_crops`, `rotation_strategies`, `soil_profiles`, `climate_monthly`, `climate_yearly`, `climate_timeseries`, `topography_points`, `ndvi_data`, `mapbiomas_data`, `risk_engine`, `chat_sessions`, `chat_messages`. Include all indices. Use exact column names and types from the spec.

- [ ] **Step 4: Run migration against Supabase**

Run the SQL via Supabase dashboard SQL editor or `supabase db push`. Verify all 14 tables exist.

- [ ] **Step 5: Verify connection**

Create a temporary test script or API route that calls `createAdminClient()` and queries `SELECT count(*) FROM sites`. Verify it returns 0 (empty tables). Remove the test after.

- [ ] **Step 6: Commit**

```bash
git add supabase/ src/lib/supabase.ts package.json package-lock.json
git commit -m "feat: supabase schema + admin client (14 tables)"
```

---

### Task 2: Seed Script — Migrate JSON Data to Supabase

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `createAdminClient()` from `src/lib/supabase.ts`; all 18 JSON files in `data/`
- Produces: All reference tables populated with data

- [ ] **Step 1: Write `scripts/seed.ts`**

The script must:
1. Read each JSON file from `data/`
2. Insert `sites` row for Cruz Alta first (capture the UUID)
3. Insert `crops` (10 rows from `crops.json`)
4. Insert `cover_crops` (9 rows from `cover_crops.json`) — normalize IDs: replace `-` with `_`
5. Insert `rotation_strategies` (3 rows from `rotations.json`)
6. Insert `soil_profiles` (1 row from `soil.json`, layers as JSONB)
7. Insert `climate_monthly` — unified from: `site.json` q1 monthly_averages (dataset="power"), `soil_moisture.json` monthly_averages (dataset="soil_moisture"), `smap_soil_moisture.json` monthly_climatology (dataset="smap"), `gpm_precipitation.json` monthly_climatology (dataset="gpm"), `grace_tws.json` monthly_climatology (dataset="grace"), `evapotranspiration.json` evapotranspiration_monthly + land_evaporation_monthly (dataset="et"), `climate_extended.json` 4 parameters x 12 months (dataset="climate_ext"), `lst.json` monthly_climatology (dataset="lst"), `ndvi.json` monthly_averages (dataset="ndvi")
8. Insert `climate_yearly` — from: `timeline.json` timeline (dataset="timeline"), `evapotranspiration.json` et_yearly_trend (dataset="et"), `smap_soil_moisture.json` yearly_trend (dataset="smap"), `gpm_precipitation.json` annual_totals (dataset="gpm"), `ndvi.json` annual_averages (dataset="ndvi"), `lst.json` yearly_trend (dataset="lst")
9. Insert `climate_timeseries` — from: `smap_soil_moisture.json` timeseries (dataset="smap"), `gpm_precipitation.json` timeseries (dataset="gpm"), `grace_tws.json` timeseries (dataset="grace")
10. Insert `topography_points` (2346 rows from `topography.json`)
11. Insert `ndvi_data` — monthly_avg (12), annual_avg (26), tiles (12) from `ndvi.json` + `ndvi_tiles.json`
12. Insert `mapbiomas_data` — current_state (10), transitions (10), timeseries (10x39=390) from `mapbiomas.json`
13. Insert `risk_engine` (1 row, full JSON as data blob)

Use `upsert` to be idempotent. Log row counts per table.

- [ ] **Step 2: Run seed script**

Run: `cd app/web && npx tsx ../../scripts/seed.ts`
Expected: All tables populated, logs show row counts matching source data.

- [ ] **Step 3: Verify data in Supabase**

Spot-check: query `SELECT count(*) FROM crops` (expect 10), `SELECT count(*) FROM topography_points` (expect 2346), `SELECT count(*) FROM climate_timeseries WHERE dataset='gpm'` (expect 333).

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: seed script — migrate 18 JSONs to supabase"
```

---

### Task 3: Types + Data Fetching Layer

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase-data.ts`

**Interfaces:**
- Consumes: `createAdminClient()` from `src/lib/supabase.ts`
- Produces: All exported types (same as current `data.ts` types) from `types.ts`. All async fetch functions from `supabase-data.ts`:
  - `getSite(siteId: string): Promise<SiteData>`
  - `getCrops(): Promise<Crop[]>`
  - `getCoverCrops(): Promise<CoverCropsData>`
  - `getRotations(siteId: string): Promise<{strategies: Strategy[], scoring_methodology: any}>`
  - `getSoilProfile(siteId: string): Promise<SoilData>`
  - `getClimateMonthly(siteId: string, dataset: string): Promise<any[]>`
  - `getClimateYearly(siteId: string, dataset: string): Promise<any[]>`
  - `getClimateTimeseries(siteId: string, dataset: string): Promise<any[]>`
  - `getTopography(siteId: string): Promise<TopographyData>`
  - `getNdvi(siteId: string): Promise<NdviData>`
  - `getNdviTiles(siteId: string): Promise<NdviTilesData>`
  - `getMapbiomas(siteId: string): Promise<MapBiomasData>`
  - `getRiskEngine(siteId: string): Promise<RiskEngineData>`
  - `getTimeline(siteId: string): Promise<TimelineData>`
  - `getSmap(siteId: string): Promise<SmapData>`
  - `getGpm(siteId: string): Promise<GpmData>`
  - `getGrace(siteId: string): Promise<GraceData>`
  - `getEvapotranspiration(siteId: string): Promise<EvapotranspirationData>`
  - `getClimateExtended(siteId: string): Promise<ClimateExtData>`
  - `getLst(siteId: string): Promise<LstData>`
  - `getSoilMoisture(siteId: string): Promise<SoilMoistureData>`
  - `getDefaultSiteId(): Promise<string>` (returns Cruz Alta's UUID)
  - `KEY_FINDINGS` (constant, same as current)
  - `MONTH_NAMES`, `MONTH_NAMES_FULL`, `SCORE_LABELS`, `SCORE_COLORS` (constants)

- [ ] **Step 1: Create `src/lib/types.ts`**

Extract all type definitions from `src/lib/data.ts` (lines 19-618). Move types only, no data imports, no runtime values. Export each type.

- [ ] **Step 2: Create `src/lib/supabase-data.ts`**

Import `createAdminClient` from `./supabase`. Import types from `./types`. Each function queries Supabase and reshapes the rows to match the existing type interfaces. The functions must reconstruct the same data shape that the pages currently receive from the static imports. Include all constants (`KEY_FINDINGS`, `MONTH_NAMES`, etc.) as plain exports.

Key reshaping:
- `getTimeline()`: Assemble from `climate_yearly` where dataset="timeline", plus `climate_monthly` where dataset="power" for monthly_normals. Reconstruct `enso_impact` by grouping timeline years by enso value.
- `getSite()`: Query `sites` + `climate_monthly` where dataset="power" + risk data to reconstruct the q1/q2/q6 shape.
- `getTopography()`: Query `topography_points`, reconstruct summary from MIN/MAX/AVG SQL.
- `getMapbiomas()`: Query `mapbiomas_data`, group by type to reconstruct current_state/transitions/group_timeseries.
- `getNdviTiles()`: Query `ndvi_data` where type="tile", reconstruct the tiles structure with palette info stored in values JSONB.

- [ ] **Step 3: Verify each function returns the same shape**

For each function, compare its output against the original JSON file structure. Spot-check at least `getSite()`, `getTimeline()`, `getCrops()`, `getTopography()`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/supabase-data.ts
git commit -m "feat: types + supabase data layer — async replacements for static imports"
```

---

### Task 4: Migrate Pages to Server Components

**Files:**
- Modify: `src/app/page.tsx` — split into server `page.tsx` + new `src/app/HomeClient.tsx`
- Modify: `src/app/painel/page.tsx` — split into server + `src/app/painel/PainelClient.tsx`
- Modify: `src/app/dados/page.tsx` — split into server + `src/app/dados/DadosClient.tsx`
- Modify: `src/app/rotacoes/page.tsx` — split into server + `src/app/rotacoes/RotacoesClient.tsx`
- Modify: `src/app/recomendacao/page.tsx` — split into server + `src/app/recomendacao/RecomendacaoClient.tsx`
- Modify: `src/app/produtor/page.tsx` — split into server + `src/app/produtor/ProdutorClient.tsx`
- Modify: `src/app/mapa/page.tsx` — split into server + `src/app/mapa/MapaClient.tsx`
- Modify: `src/lib/recommendation-engine.ts` — change to accept data as params

**Interfaces:**
- Consumes: All async functions from `supabase-data.ts`, all types from `types.ts`
- Produces: All pages rendering from Supabase data instead of static JSON imports

The pattern for each page:

```
// page.tsx (server component — no "use client")
import { getX, getY } from "@/lib/supabase-data";
import PageClient from "./PageClient";

export default async function Page() {
  const [x, y] = await Promise.all([getX(), getY()]);
  return <PageClient x={x} y={y} />;
}

// PageClient.tsx ("use client" — all the interactive logic)
"use client";
export default function PageClient({ x, y }: Props) {
  // ... existing component logic, using props instead of imports
}
```

- [ ] **Step 1: Modify `recommendation-engine.ts` to accept data as parameters**

Currently imports `coverCrops, timeline, riskEngine, rotations` at module scope. Refactor `getSmartRecommendation()` to accept these as function parameters instead. Keep the `DEFAULT_PROFILE` constant export. Import types from `./types` instead of `./data`.

- [ ] **Step 2: Migrate `/` (homepage)**

Split `page.tsx` into server component + `HomeClient.tsx`. Server fetches: `getTimeline()`, `getRiskEngine()`, `getSite()`. Passes data as props to HomeClient. HomeClient contains all the existing interactive logic (year selector, profile form, recommendations). Update `getSmartRecommendation()` call to pass data.

- [ ] **Step 3: Migrate `/painel`**

Server fetches: `getTimeline()`, `getRiskEngine()`, `getRotations()`. Client component receives as props.

- [ ] **Step 4: Migrate `/dados`**

This is the largest page (2685 lines). Server fetches ALL datasets in parallel with `Promise.all()`. Client component receives all data as props. The tab-based UI is entirely client-side.

- [ ] **Step 5: Migrate `/rotacoes`**

Server fetches: `getRotations()`, `getCrops()`, `getCoverCrops()`. Client receives as props. The RadarChart and all comparison logic stays client-side.

- [ ] **Step 6: Migrate `/recomendacao`**

Server fetches: `getTimeline()`, `getSite()`, `getSoilProfile()`, `getRotations()`, `getCrops()`. Passes to client component which runs `getSmartRecommendation()` with the data.

- [ ] **Step 7: Migrate `/produtor`**

Server fetches: `getCoverCrops()` (only dataset this page uses). Client receives as props. The localStorage-based form logic stays client-side.

- [ ] **Step 8: Migrate `/mapa`**

Server fetches: `getNdviTiles()`, `getTopography()`, `getSite()`, `getMapbiomas()`. Client receives as props. Leaflet map initialization stays client-side. (Multi-layer conversion happens in Task 7.)

- [ ] **Step 9: Run dev server and verify all pages load**

Run: `cd app/web && npm run dev`
Navigate to each page: `/`, `/painel`, `/dados`, `/mapa`, `/rotacoes`, `/recomendacao`, `/produtor`. Verify data renders correctly — same as before migration.

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: migrate all pages to server components with supabase data"
```

---

### Task 5: Remove Static JSON Imports

**Files:**
- Remove: `src/lib/data.ts`
- Remove: `data/*.json` (18 files)

**Interfaces:**
- Consumes: Verification that all pages work from Task 4
- Produces: Clean codebase with no static data imports

- [ ] **Step 1: Verify no remaining imports from `data.ts` or `data/*.json`**

Run: `grep -r "from.*data.ts\|from.*data\.json\|from.*\/data\/" src/ --include="*.ts" --include="*.tsx" | grep -v supabase-data | grep -v types`
Expected: No results.

Also: `grep -r 'from.*"\.\./\.\./\.\./data/' src/ --include="*.tsx"`
Expected: No results (the mapa page's direct JSON imports should be gone).

- [ ] **Step 2: Remove `src/lib/data.ts` and `data/` directory**

- [ ] **Step 3: Run build to verify**

Run: `cd app/web && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove static JSON data — all data served from supabase"
```

---

### Task 6: Chat AI — API Route + Component

**Files:**
- Create: `src/lib/chat-context.ts`
- Create: `src/app/api/chat/route.ts`
- Create: `src/app/api/chat/sessions/route.ts`
- Create: `src/app/api/chat/sessions/[id]/route.ts`
- Create: `src/components/Chat.tsx`
- Modify: `src/app/page.tsx` — add Chat component
- Modify: `src/app/HomeClient.tsx` — integrate Chat
- Modify: `package.json` — add `@anthropic-ai/sdk`

**Interfaces:**
- Consumes: `createAdminClient()` from `supabase.ts`, all fetch functions from `supabase-data.ts`
- Produces:
  - `POST /api/chat` — accepts `{session_id?, anonymous_id, message, site_id?}`, returns SSE stream
  - `GET /api/chat/sessions?anonymous_id=X` — returns session list
  - `GET /api/chat/sessions/[id]?anonymous_id=X` — returns session with messages
  - `classifyTopic(message: string, history: string[]): string[]` from `chat-context.ts`
  - `assembleContext(siteId: string, topics: string[]): Promise<string>` from `chat-context.ts`
  - `<Chat />` component — self-contained chat UI

- [ ] **Step 1: Install `@anthropic-ai/sdk`**

Run: `cd app/web && npm install @anthropic-ai/sdk`

- [ ] **Step 2: Create `src/lib/chat-context.ts`**

Two functions:
- `classifyTopic(message: string, history: string[]): string[]` — keyword-based classification. Returns array of topics: "clima", "solo", "culturas", "tendencias", "vegetacao". Simple regex matching on Portuguese agricultural terms.
- `assembleContext(siteId: string, topics: string[]): Promise<string>` — fetches relevant data from Supabase based on topics, formats as compact text for the system prompt. Always includes: site summary, soil profile summary, current risk scenario, crop list. Conditionally includes topic-specific data.

- [ ] **Step 3: Create `src/app/api/chat/route.ts` — POST handler with streaming**

Flow:
1. Parse body: `{session_id?, anonymous_id, message, site_id?}`
2. Validate `anonymous_id` is present
3. If no `session_id`, create new `chat_sessions` row, generate title from first 50 chars of message
4. Fetch existing messages from `chat_messages` for this session (limit last 20)
5. Call `classifyTopic()` with current message + recent history
6. Call `assembleContext()` with site_id and topics
7. Build messages array: system prompt + context + history + new user message
8. Save user message to `chat_messages`
9. Call Claude API with streaming (`stream: true`, model: `claude-sonnet-4-20250514`)
10. Return `ReadableStream` with `text/event-stream` content type
11. As tokens arrive, forward as SSE `data:` events
12. On completion, save full assistant response to `chat_messages`
13. Handle client disconnect: abort Claude stream
14. Post-processing: after assistant response is complete, scan conversation for producer data (area_ha, culturas, problemas) using regex heuristics, update `chat_sessions.producer_context` JSONB

System prompt structure:
```
Voce e um agronomo especialista em rotacao de culturas para o Rio Grande do Sul.
Voce conhece profundamente os dados de satelite da NASA para a regiao de Cruz Alta-RS.

Seu objetivo: ajudar o produtor a escolher a melhor estrategia de rotacao de culturas
e plantas de cobertura para a propriedade dele.

Regras:
- Faca perguntas simples e diretas ao produtor (maximo 2-3 por mensagem)
- Use os dados cientificos para justificar suas recomendacoes
- Fale como agronomo experiente, tom direto e pratico
- Responda em portugues, sem jargao tecnico desnecessario
- Quando tiver dados suficientes do produtor, proponha uma estrategia concreta

Dados do produtor ate agora:
{producer_context}

Dados cientificos da regiao:
{assembled_context}
```

- [ ] **Step 4: Create `GET /api/chat/sessions/route.ts`**

Query `chat_sessions` filtered by `anonymous_id` from query params. Return `{sessions: [{id, title, created_at, updated_at}]}`. Order by `updated_at DESC`. Limit 50.

- [ ] **Step 5: Create `GET /api/chat/sessions/[id]/route.ts`**

Query session + messages. Validate `anonymous_id` matches the session's `anonymous_id`. Return `{session, messages}`.

- [ ] **Step 6: Create `src/components/Chat.tsx`**

Client component with:
- Text input with send button
- Message list (scrollable, auto-scroll to bottom)
- Streaming display (tokens appear as they arrive via SSE)
- Anonymous ID management: read from localStorage, generate UUID if missing
- Session management: create new session on first message, persist session_id
- Loading state while waiting for response
- Compact design: fixed to bottom-right of homepage, expandable

- [ ] **Step 7: Integrate Chat into homepage**

Modify `HomeClient.tsx` to include `<Chat />` component. The chat sits at the bottom of the page or as a floating panel.

- [ ] **Step 8: Test the full chat flow**

Run dev server. Open homepage. Type a message. Verify:
- Session is created in Supabase
- Claude responds with streaming
- Messages are saved
- Refresh page — session persists (same anonymous_id)

- [ ] **Step 9: Commit**

```bash
git add src/ package.json package-lock.json
git commit -m "feat: AI chat — claude streaming + chat UI on homepage"
```

---

### Task 7: Mapa — Stackable Layers with Opacity

**Files:**
- Modify: `src/app/mapa/MapaClient.tsx` (created in Task 4)

**Interfaces:**
- Consumes: Same props from server component (topography, ndviTiles, site, mapbiomas)
- Produces: Multi-layer map with independent toggle and opacity per layer

- [ ] **Step 1: Replace state model**

Change from:
```ts
const [activeLayer, setActiveLayer] = useState<Layer>("relevo");
```
To:
```ts
const [layers, setLayers] = useState<Record<Layer, { visible: boolean; opacity: number }>>({
  relevo: { visible: true, opacity: 0.7 },
  temperatura: { visible: false, opacity: 0.7 },
  ndvi: { visible: false, opacity: 0.75 },
  "uso-do-solo": { visible: false, opacity: 1 },
});
```

- [ ] **Step 2: Refactor overlay management**

Each layer gets its own ref (`useRef` per layer). The effect that draws overlays runs per-layer independently — adding or removing a layer does not affect others. Use separate `useEffect` per layer, keyed on that layer's visibility and opacity.

Z-index panes:
- relevo: zIndex 400
- temperatura: zIndex 410
- ndvi: zIndex 420
- uso-do-solo: zIndex 430

- [ ] **Step 3: Implement opacity control**

Each visible layer's overlay calls `setOpacity(value)` when the slider changes. For heatLayer (relevo, temperatura), opacity is set via `layer.setOptions({opacity})` or by removing/re-adding with new config. For tile layers (NDVI), use `layer.setOpacity(value)`.

- [ ] **Step 4: Replace layer buttons with layer cards**

Each layer becomes a card with:
- Checkbox to toggle visibility
- Layer name and short description
- Opacity slider (range 0-100, shown as percentage)
- Legend section (visible only when layer is active)

Layout: vertical stack of cards above or beside the map.

- [ ] **Step 5: Handle uso-do-solo layer as map overlay**

Currently, uso-do-solo only shows a legend/stats panel, not a map overlay. Keep this behavior but make it togglable alongside the others. When visible, the stats panel appears below the map.

- [ ] **Step 6: Test multi-layer combinations**

Run dev server. Toggle combinations:
- Relevo + NDVI together
- Temperatura + NDVI together
- All four layers at once
- Adjust opacity of each independently
- Verify legends show for all active layers

- [ ] **Step 7: Commit**

```bash
git add src/app/mapa/
git commit -m "feat: stackable map layers with per-layer opacity controls"
```

---

### Task 8: Session Cleanup + Final Polish

**Files:**
- Create: `src/app/api/cleanup/route.ts` — purge old anonymous sessions
- Modify: `src/components/Navigation.tsx` — add Chat link if needed

**Interfaces:**
- Consumes: `createAdminClient()` from `supabase.ts`
- Produces: Cleanup endpoint, final working state

- [ ] **Step 1: Create cleanup API route**

`DELETE /api/cleanup` with a secret key check (`CLEANUP_SECRET` env var). Deletes `chat_sessions` (and cascading messages) older than 30 days. Returns count of deleted sessions. This can be called via Vercel Cron.

- [ ] **Step 2: Add env vars to `.env.example`**

Create `.env.example` listing all required env vars (no values):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CLEANUP_SECRET=
```

- [ ] **Step 3: Final build verification**

Run: `cd app/web && npm run build`
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 4: Run dev server and test all pages**

Navigate to each page. Verify:
- Homepage: data loads, chat works, streaming responses
- Painel: all charts and data render
- Dados: all tabs load data
- Mapa: layers stack, opacity works
- Rotacoes: radar chart and strategies render
- Recomendacao: recommendations generate
- Produtor: form works, saves to localStorage

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: session cleanup + env template — field shift platform complete"
```
