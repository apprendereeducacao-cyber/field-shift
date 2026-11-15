# Field Shift — Plano de Execucao: Duas Frentes Paralelas

Data: 2026-11-15
Status: APROVADO PARA EXECUCAO

---

## FRENTE 1: Algoritmo de Padroes Climaticos

### Objetivo
Cruzar todas as camadas de dados satelite + historico climatico para encontrar padroes multi-ano, gerar score de similaridade entre anos, e projetar cenarios futuros.

### Dados Disponiveis (todos para Cruz Alta-RS)

| Dataset | Fonte | Resolucao | Periodo | Tabela Supabase |
|---------|-------|-----------|---------|-----------------|
| Elevacao | SRTM | 30m | estatico | map_tiles (srtm) |
| Temperatura superficie | MODIS LST | 1km | 2020-2024, mensal | map_tiles (lst) |
| Temperatura superficie | ECOSTRESS | 70m | 2018-2026, mensal | map_tiles (ecostress) |
| NDVI vegetacao | Sentinel-2 | 10m | 2015-2026, mensal+anual | ndvi_data |
| Precipitacao | GPM IMERG | 10km | 2020-2024, mensal | map_tiles (gpm) |
| Umidade do solo | SMAP L4 | 9km | 2020-2024, mensal | map_tiles (smap) |
| Uso do solo | MapBiomas | 30m | 1990-2023 | map_tiles (mapbiomas) |
| Clima historico | NASA POWER | estacao | 1981-2025 (44 anos) | climate_yearly, climate_monthly |
| Produtividade soja | IBGE/CONAB | municipal | 1981-2025 | climate_yearly (timeline) |
| ENSO | CPC/NOAA | global | 1981-2025 | climate_yearly (timeline) |
| Agua subterranea | GRACE/GRACE-FO | 300km | 2002-2024 | climate_monthly (grace) |
| Evapotranspiracao | MODIS MOD16 | 500m | mensal | climate_monthly (et) |
| Radiacao/vento/umidade | NASA POWER | estacao | mensal | climate_monthly (climate_ext_*) |
| Risk Engine | calculado | - | 1981-2025 | risk_engine |

### Algoritmo Proposto: Year Analog Scoring (YAS)

#### Conceito
Para cada ano historico, criar um "vetor climatico" multidimensional. Comparar o ano atual (2026) com todos os historicos via distancia euclidiana normalizada. Retornar os N anos mais similares e projetar cenarios.

#### Dimensoes do Vetor (por ano)

1. **Precipitacao total safra** (out-mar) — mm
2. **Precipitacao critica** (dez-fev) — mm (correlacao 0.63 com produtividade)
3. **Dias quentes** (>=32C, out-mar) — contagem
4. **Dias de geada** (jul-set) — contagem
5. **Umidade do solo media** (out-mar) — kg/m2
6. **ENSO fase** (El Nino=1, Neutro=0, La Nina=-1)
7. **Temperatura media verao** (dez-fev) — C
8. **NDVI medio safra** (jan-mar) — indice (quando disponivel, 2015+)
9. **Precipitacao inverno** (jun-ago) — mm

#### Calculo de Similaridade

```
Para cada par de anos (A, B):
  1. Normalizar cada dimensao: z = (valor - media) / desvio_padrao
  2. Distancia euclidiana: d = sqrt(sum((zA[i] - zB[i])^2))
  3. Similaridade: sim = 1 / (1 + d) * 100  →  0-100%
```

#### Output

```json
{
  "target_year": 2026,
  "months_available": ["jan", "feb", ..., "oct"],
  "analog_years": [
    {
      "year": 2012,
      "similarity_pct": 87.3,
      "matching_dimensions": ["precipitacao", "enso", "temperatura"],
      "diverging_dimensions": ["dias_quentes"],
      "outcome": {
        "yield_sc_ha": 42.1,
        "class": "safra_boa"
      }
    },
    ...
  ],
  "projection": {
    "expected_yield_range": [38.5, 44.2],
    "confidence": "media",
    "risk_factors": ["precipitacao_dez_abaixo_media"],
    "recommendation": "Monitorar precipitacao de dezembro..."
  }
}
```

#### Implementacao

1. **Supabase function ou API route** (`/api/patterns`) que:
   - Busca todos os dados historicos do site
   - Calcula vetores climaticos por ano
   - Compara com ano atual
   - Retorna ranking de anos analogos
2. **Tabela nova**: `year_patterns` (site_id, year, vector, comparisons)
3. **Componente visual**: card mostrando "2026 se parece com..." + gauge de similaridade

### Entregaveis

- [ ] Script Python para calcular vetores e popular tabela
- [ ] API route /api/patterns para consulta em tempo real
- [ ] Componente PatternEngine no frontend
- [ ] Integracao com o chat AI (contexto de padroes)

---

## FRENTE 2: Redesign do Frontend

### Direcao Visual (do HQ REVISAO-DESIGN.md)

**Estilo**: "Moss and Machines" — canvas escuro, tipografia limpa, numeros como protagonistas.

#### Tokens de Design

```css
:root {
  --bg-base: #0B1120;
  --bg-surface: #111827;
  --bg-surface-alt: #1F2937;
  --primary: #2D6A4F;
  --primary-hover: #357A5B;
  --primary-light: #40916C;
  --data: #74C69D;           /* numeros-chave */
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  --text-dim: #8B95A3;       /* atualizado de #6B7280 para passar AA */
  --accent: #42A5F5;         /* links e selo NASA */
  --warning: #FF8F00;
  --border: #374151;
  --border-control: #64707F;
}
```

#### Tipografia (Inter)

| Papel | Mobile | Desktop | Peso |
|-------|--------|---------|------|
| Hero | 32px | 52px | 600, tracking -0.025em |
| H1 pagina | 28px | 36px | 600, tracking -0.025em |
| H2 secao | 22px | 28px | 600, tracking -0.02em |
| Numero-ancora | 40px | 56px | 600, tabular, --data |
| Numero cartao | 24px | 30px | 600, tabular |
| Corpo | 16px | 16px | 400 |
| Nota | 14px | 14px | 400 |
| Minimo | 12px | 12px | 500 |

**Regra**: nada abaixo de 12px. Titulos font-semibold (nao bold).

### Estrutura de Paginas (Novo Fluxo)

#### HOME (/) — Globo + Busca
- Tela cheia, fundo escuro
- **Globo 3D** girando (Three.js/react-three-fiber) centralizado
- **Barra de busca** sobreposta: "Pesquise seu municipio..."
- Ao digitar: autocomplete com municipios
- Ao selecionar: globo faz zoom ate Cruz Alta → transicao para mapa
- Abaixo do globo (scroll): hero com numero-ancora + CTA
- Design minimalista, sem menu visivel no first fold

#### MAPA (/mapa) — Ja existe, manter funcionalidades
- Manter todas as 7 camadas satelite
- Aplicar novo design (cores, tipografia, cartoes)
- Painel lateral segue estilo OneSoil (recolhido por default no mobile)

#### PAINEL (/painel) — Dashboard de dados
- Manter todos os graficos e dados
- Aplicar novo layout com cartoes --data
- Numeros grandes como protagonistas

#### PRODUTOR (/produtor) — Recomendacoes
- Rotacao de cultura + plantas de cobertura
- Integrar output do algoritmo de padroes
- Cards com score e recomendacoes

#### DADOS (/dados) — Explorador de dados
- Manter funcionalidades
- Aplicar novo design

### Navegacao
- Header minimalista: logo + links + campo de busca
- No home: header transparente sobre o globo
- Nas demais paginas: header com fundo --bg-base

### Tecnologias Adicionais
- **react-three-fiber** + **@react-three/drei** para globo 3D
- **three-globe** ou implementacao custom
- Manter Next.js + Tailwind + Supabase

### Entregaveis

- [ ] globals.css com novos tokens
- [ ] Layout base (header, footer) redesenhado
- [ ] Home com globo 3D + busca
- [ ] Transicao globo → mapa
- [ ] Redesign do painel /painel
- [ ] Redesign do mapa /mapa (visual, nao funcional)
- [ ] Redesign do produtor /produtor
- [ ] Redesign de /dados

---

## Ordem de Execucao

### Fase 1 — Fundacao (ambas frentes)
1. Novos tokens CSS + layout base (Frente 2)
2. Script de calculo de vetores climaticos (Frente 1)

### Fase 2 — Core
3. Home com globo 3D + busca (Frente 2)
4. API de padroes + tabela year_patterns (Frente 1)

### Fase 3 — Integracao
5. Redesign das paginas existentes (Frente 2)
6. Componente de padroes no frontend (Frente 1)
7. Integracao padroes → chat AI + recomendacoes

### Fase 4 — Polish
8. Transicoes e animacoes
9. Testes em mobile
10. Performance e loading states

---

## Notas

- **Nenhuma funcionalidade sera removida** — apenas visual muda
- **Cruz Alta only** neste momento — arquitetura pronta para escalar
- Repositorio de referencia: github.com/FieldShift-SpaceApp/fieldshift-hq.git
- Design direction: REVISAO-DESIGN.md do HQ
