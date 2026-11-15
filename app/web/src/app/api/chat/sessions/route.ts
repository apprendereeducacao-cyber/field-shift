import { createAdminClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anonymousId = searchParams.get("anonymous_id");

  if (!anonymousId) {
    return Response.json(
      { error: "anonymous_id is required" },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const { data: sessions, error } = await db
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("anonymous_id", anonymousId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  return Response.json({ sessions: sessions ?? [] });
}
