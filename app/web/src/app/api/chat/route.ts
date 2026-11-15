import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import {
  classifyTopic,
  assembleContext,
  SYSTEM_PROMPT,
} from "@/lib/chat-context";
import { getDefaultSiteId } from "@/lib/supabase-data";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const body = await request.json();
  const {
    session_id,
    anonymous_id,
    message,
    site_id,
  }: {
    session_id?: string;
    anonymous_id: string;
    message: string;
    site_id?: string;
  } = body;

  if (!anonymous_id || !message) {
    return Response.json(
      { error: "anonymous_id and message are required" },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return Response.json(
      { error: "Message too long (max 2000 characters)" },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const resolvedSiteId = site_id ?? (await getDefaultSiteId());

  let sessionId = session_id;
  if (!sessionId) {
    const title = message.slice(0, 60) + (message.length > 60 ? "..." : "");
    const { data: newSession, error } = await db
      .from("chat_sessions")
      .insert({
        anonymous_id,
        site_id: resolvedSiteId,
        title,
      })
      .select("id")
      .single();

    if (error || !newSession) {
      return Response.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
    sessionId = newSession.id;
  } else {
    const { data: owned } = await db
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("anonymous_id", anonymous_id)
      .single();

    if (!owned) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
  }

  const { data: existingMessages } = await db
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (existingMessages ?? []).map((m) => m.content);
  const topics = classifyTopic(message, history);
  const context = await assembleContext(resolvedSiteId, topics);

  const { data: sessionData } = await db
    .from("chat_sessions")
    .select("producer_context")
    .eq("id", sessionId)
    .single();

  const producerCtx = sessionData?.producer_context
    ? JSON.stringify(sessionData.producer_context)
    : "Nenhum dado coletado ainda.";

  const systemPrompt = `${SYSTEM_PROMPT}\n\nDados do produtor ate agora:\n${producerCtx}\n\nDados cientificos da regiao:\n${context}`;

  const conversationMessages: Anthropic.MessageParam[] = [
    ...(existingMessages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  await db.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ session_id: sessionId })}\n\n`)
        );

        const messageStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationMessages,
        });

        request.signal.addEventListener("abort", () => {
          messageStream.abort();
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();

        await db.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: fullResponse,
        });

        await db
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId);

        const producerData = extractProducerData(fullResponse, message);
        if (Object.keys(producerData).length > 0) {
          const { data: current } = await db
            .from("chat_sessions")
            .select("producer_context")
            .eq("id", sessionId)
            .single();

          await db
            .from("chat_sessions")
            .update({
              producer_context: {
                ...(current?.producer_context ?? {}),
                ...producerData,
              },
            })
            .eq("id", sessionId);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMsg })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function extractProducerData(
  assistantMsg: string,
  userMsg: string
): Record<string, string | number> {
  const data: Record<string, string | number> = {};
  const combined = userMsg + " " + assistantMsg;

  const areaMatch = combined.match(
    /(\d+(?:[.,]\d+)?)\s*(?:hectares?|ha)\b/i
  );
  if (areaMatch) {
    data.area_ha = parseFloat(areaMatch[1].replace(",", "."));
  }

  const cropPatterns =
    /\b(soja|milho|trigo|aveia|canola|cevada|sorgo|feijao|girassol)\b/gi;
  const crops = new Set<string>();
  let match;
  while ((match = cropPatterns.exec(combined)) !== null) {
    crops.add(match[1].toLowerCase());
  }
  if (crops.size > 0) {
    data.culturas = [...crops].join(", ");
  }

  return data;
}
