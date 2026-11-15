import { createAdminClient } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/chat/sessions/[id]">
) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(_req.url);
  const anonymousId = searchParams.get("anonymous_id");

  if (!anonymousId) {
    return Response.json(
      { error: "anonymous_id is required" },
      { status: 400 }
    );
  }

  const db = createAdminClient();

  const { data: session, error: sessionError } = await db
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .eq("anonymous_id", anonymousId)
    .single();

  if (sessionError || !session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages } = await db
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return Response.json({ session, messages: messages ?? [] });
}
