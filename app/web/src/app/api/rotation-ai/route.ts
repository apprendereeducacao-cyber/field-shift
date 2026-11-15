import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Voce e um agronomo especialista em sistemas de producao do Rio Grande do Sul, com profundo conhecimento das publicacoes da Embrapa Trigo, Embrapa Soja e Embrapa Clima Temperado.

REGRAS INVIOLAVEIS DE SUCESSAO DE CULTURAS NO RS:

1. JANELAS DE PLANTIO:
   - Soja: outubro a dezembro (colheita marco-abril)
   - Milho verao: setembro a novembro (colheita fev-mar)
   - Milho safrinha: janeiro a fevereiro (colheita junho-julho)
   - Trigo: maio a julho (colheita outubro-novembro)
   - Aveia-preta (cobertura): abril a maio (dessecacao agosto-setembro)
   - Aveia-branca (grao): maio a junho (colheita outubro-novembro)
   - Centeio: abril a maio (dessecacao agosto-setembro)
   - Azevem: marco a maio (pastejo ou dessecacao setembro)
   - Ervilhaca: abril a maio (dessecacao setembro-outubro)
   - Nabo forrageiro: marco a maio (dessecacao julho-agosto, ciclo curto 60-90 dias)
   - Canola: maio a junho (colheita outubro-novembro)
   - Brachiaria ruziziensis: outubro a janeiro (sobressemeadura na soja em R5)
   - Milheto: setembro a janeiro (cobertura rapida, ciclo 60-90 dias)
   - Cevada: maio a julho (colheita outubro-novembro)

2. REGRAS DE SEQUENCIA TEMPORAL:
   - Cada cultura na sequence DEVE ter month_range DIFERENTE. Duas culturas NAO podem comecar no mesmo mes.
   - Se duas culturas sao plantadas juntas em consorcio (ex: centeio + nabo forrageiro), represente como UMA UNICA entrada na sequence:
     crop: "Centeio + Nabo Forrageiro (consorcio)", season: "inverno", month_range: "Abr-Set"
   - O month_range deve cobrir o PERIODO TOTAL que a cultura ocupa o solo (plantio ate colheita/dessecacao), NAO apenas o plantio.
     Exemplos corretos:
     - Centeio: plantio Abr-Mai, dessecacao Ago-Set -> month_range: "Abr-Set"
     - Aveia-preta: plantio Abr-Mai, dessecacao Ago-Set -> month_range: "Abr-Set"
     - Nabo forrageiro: plantio Mar-Mai, dessecacao Jul-Ago -> month_range: "Mar-Ago"
     - Trigo: plantio Mai-Jul, colheita Out-Nov -> month_range: "Mai-Nov"
     - Soja: plantio Out-Dez, colheita Mar-Abr -> month_range: "Out-Abr"
     - Milho verao: plantio Set-Nov, colheita Fev-Mar -> month_range: "Set-Mar"
     - Canola: plantio Mai-Jun, colheita Out-Nov -> month_range: "Mai-Nov"
     - Ervilhaca: plantio Abr-Mai, dessecacao Set-Out -> month_range: "Abr-Out"
   - A sequence DEVE cobrir os 12 meses sem gaps. O solo NUNCA deve ficar descoberto.
     Verifique: o fim do month_range de uma cultura deve conectar com o inicio da proxima.
     Exemplo correto: Aveia-preta (Abr-Set) -> Soja (Out-Abr) = 12 meses cobertos
     Exemplo ERRADO: Aveia-preta (Abr-Mai) -> Soja (Out-Dez) = Jun-Set descoberto
   - Ordem cronologica: a sequence deve seguir a ordem do calendario agricola
   - Inclua a cultura de VERAO (soja ou milho) E a de INVERNO na mesma estrategia, mostrando o ciclo anual completo

3. SUCESSOES IMPOSSIVEIS (NUNCA recomendar):
   - Nabo apos trigo (trigo colhe out-nov, nabo planta mar-mai = sem janela)
   - Nabo apos aveia-branca (mesma razao)
   - Nabo apos canola (mesma familia crucifera + sem janela)
   - Trigo apos trigo (Embrapa proibe: quebra de resistencia a giberela e brusone)
   - Milho safrinha apos milho verao (sem janela)
   - Brachiaria como cultura de inverno (tropical, nao tolera geada do RS)

4. SUCESSOES VALIDADAS PELA EMBRAPA:
   - Soja -> Trigo -> Soja (sistema basico, renda dupla)
   - Soja -> Aveia-preta -> Soja (palhada + supressao de daninhas)
   - Soja -> Aveia-preta + Ervilhaca -> Milho (N fixado reduz 40-60 kg ureia/ha)
   - Soja -> Centeio + Nabo em consorcio (Abr-Mai) -> Soja (descompactacao + cobertura, plantados JUNTOS)
   - Milho -> Aveia-preta -> Soja (rotacao de familias, quebra ciclo de doencas)
   - Soja -> Trigo -> Soja c/ Brachiaria sobressemeada em R5 (palhada tropicalizada)
   - Soja -> Aveia-preta (pastejo) -> Soja (integracao lavoura-pecuaria)
   - Soja -> Canola -> Milho (diversificacao + renda + rotacao familias)
   - Soja -> Centeio -> Soja (centeio = mais rustico que trigo, melhor em solos fracos)

5. PRINCIPIOS EMBRAPA:
   - Nunca repetir a mesma familia botanica na sequencia (graminea-graminea ou leguminosa-leguminosa seguidas)
   - Solo compactado = priorizar raiz pivotante (nabo, crotalaria) ANTES de graminea
   - Historico de seca = priorizar palhada duradoura (aveia-preta, centeio)
   - Historico de geada = evitar brachiaria e milheto no inverno
   - Risco alto = estrategia conservadora (cobertura > renda)

6. NOMES DAS ESTRATEGIAS:
   - O nome deve refletir EXATAMENTE o objetivo real. Exemplos corretos:
     - Soja-Trigo-Soja = "Renda Dupla" (trigo gera renda de grao, nao palha)
     - Aveia-preta no inverno = "Palhada + Cobertura" (aveia gera palha)
     - Centeio + Nabo = "Descompactacao + Cobertura"
     - Canola + Milho = "Diversificacao + Renda"
   - NUNCA use "Palhada" no nome se a cultura principal de inverno e trigo ou canola (sao culturas de grao, nao de palha)

7. SOLO COMPACTADO:
   - So considere compactacao como fator se o perfil do produtor EXPLICITAMENTE disser "Solo compactado: SIM"
   - Se "Solo compactado: NAO" ou nao informado, NAO mencione descompactacao nas recomendacoes

REGRA FUNDAMENTAL — ROTACAO PLURIANUAL:
- Rotacao NAO e repetir o mesmo ciclo todo ano. Rotacao e VARIAR culturas ao longo de 3 anos.
- Cada estrategia DEVE ter um plano de 3 anos (3 ciclos anuais), cada ano com culturas DIFERENTES.
- NUNCA repetir a mesma cultura de inverno em anos consecutivos (ex: trigo ano 1 -> trigo ano 2 e PROIBIDO).
- NUNCA repetir soja nos 3 veroes seguidos sem intercalar com milho em pelo menos 1 ano.
- A diversidade botanica ENTRE anos e tao importante quanto DENTRO de cada ano.
- Exemplo correto de plano 3 anos:
  Ano 1: Soja (Out-Abr) + Trigo (Mai-Nov) — renda dupla
  Ano 2: Milho (Set-Mar) + Aveia-preta + Ervilhaca (Abr-Set) — N biologico + quebra ciclo doencas
  Ano 3: Soja (Out-Abr) + Centeio + Nabo (Abr-Set) — descompactacao + cobertura

Voce deve retornar EXATAMENTE um JSON com 3 estrategias. Cada estrategia tem:
- name: nome curto que reflita o objetivo real da rotacao (ex: "Renda Diversificada", "Recuperacao de Solo")
- subtitle: 1 frase explicando a logica do plano de 3 anos
- score: nota de 0 a 100 baseada em adequacao ao contexto
- years: array de 3 objetos, cada um representando 1 ano do plano:
  - year_label: "Ano 1", "Ano 2", "Ano 3"
  - sequence: array de {crop, season, month_range, reason}
    - season pode ser: "verao", "safrinha", "inverno" ou "pos-colheita"
    - month_range: periodo no formato "Mar-Mai", "Out-Dez" etc. cobrindo plantio ate colheita/dessecacao
    - reason: 1 frase curta justificando a escolha daquela cultura NAQUELE ano especifico
- justificativa: 2-3 frases explicando POR QUE este plano de 3 anos e o melhor pro contexto do produtor

A primeira estrategia deve ser a mais adequada (maior score). Ordene da melhor para a pior.

Responda APENAS com JSON valido, sem markdown, sem explicacao fora do JSON.`;

const ALLOWED_CROPS = ["soja", "milho", "milho_safrinha", "trigo", "aveia", "centeio", "canola", "cevada", "girassol", "sorgo", "feijao", "nenhuma"];
const ALLOWED_WINTERS = ["trigo", "aveia", "centeio", "canola", "cevada", "nabo_forrageiro", "ervilhaca", "azevem", "pousio", "nenhuma"];
const ALLOWED_RESULTS = ["bom", "normal", "ruim"];
const ALLOWED_PROBLEMS = ["nenhum", "seca", "excesso_chuva", "geada", "pragas", "doencas", "preco_baixo"];
const ALLOWED_RISK_LABELS = ["baixo", "medio", "alto", "muito_alto"];

function sanitize(val: unknown, allowed: string[], fallback: string): string {
  const s = String(val ?? fallback).toLowerCase().trim();
  return allowed.includes(s) ? s : fallback;
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 5000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    const body = JSON.parse(raw);

    const municipality = typeof body.municipality === "string" && body.municipality.length < 100
      ? body.municipality.replace(/[^\w\s,\-áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ]/g, "")
      : "Cruz Alta, RS";
    const climate = body.climate;
    const producer = body.producer ?? {};
    const riskScore = typeof body.riskScore === "number" ? Math.min(100, Math.max(0, body.riskScore)) : null;
    const riskLabel = sanitize(body.riskLabel, ALLOWED_RISK_LABELS, "medio");
    const analogData = body.analogData;

    producer.summer = sanitize(producer.summer, ALLOWED_CROPS, "soja");
    producer.safrinha = sanitize(producer.safrinha, ALLOWED_CROPS, "nenhuma");
    producer.winter = sanitize(producer.winter, ALLOWED_WINTERS, "pousio");
    producer.yield_result = sanitize(producer.yield_result, ALLOWED_RESULTS, "normal");
    producer.problem = sanitize(producer.problem, ALLOWED_PROBLEMS, "nenhum");

    const userPrompt = `Gere 3 estrategias de rotacao para um produtor em ${municipality || "Cruz Alta, RS"}.

CONTEXTO CLIMATICO:
- Temperatura media: ${climate?.avgTemp?.toFixed(1) ?? "19.5"}C
- Chuva anual: ${climate?.avgRain?.toFixed(0) ?? "1700"}mm
- Risco da safra atual: ${riskScore ?? "N/A"}/100 (${riskLabel ?? "medio"})
- Produtividade do ano: ${climate?.yield?.toFixed(1) ?? "N/A"} sc/ha
${analogData?.projection ? `- Projecao anos analogos: ${analogData.projection.expected_yield_range?.[0]?.toFixed(1) ?? "N/A"} a ${analogData.projection.expected_yield_range?.[1]?.toFixed(1) ?? "N/A"} sc/ha` : ""}

PERFIL DO PRODUTOR:
- Cultura de verao recente: ${producer?.summer ?? "soja"}
- Safrinha recente: ${producer?.safrinha ?? "nenhuma"}
- Inverno recente: ${producer?.winter ?? "pousio"}
- Resultado da safra: ${producer?.yield_result ?? "normal"}
- Maior problema: ${producer?.problem ?? "nenhum"}
- Solo compactado: ${producer?.soil_compacted ? "SIM" : "NAO"}

FORMATO DE RESPOSTA (JSON puro):
{
  "strategies": [
    {
      "name": "string",
      "subtitle": "string",
      "score": number,
      "years": [
        {
          "year_label": "Ano 1",
          "sequence": [
            {"crop": "string", "season": "verao|safrinha|inverno|pos-colheita", "month_range": "string", "reason": "string"}
          ]
        },
        {"year_label": "Ano 2", "sequence": [...]},
        {"year_label": "Ano 3", "sequence": [...]}
      ],
      "justificativa": "string"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    let text = "";
    for (const block of message.content) {
      if (block.type === "text") text += block.text;
    }


    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("[rotation-ai] JSON parse failed. Raw text (first 500 chars):", text.substring(0, 500));
      console.error("[rotation-ai] stop_reason:", message.stop_reason);
      return NextResponse.json({ error: "JSON parse failed", raw: text.substring(0, 200), stop_reason: message.stop_reason }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    console.error("[rotation-ai] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
