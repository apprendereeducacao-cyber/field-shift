import { createAdminClient } from "@/lib/supabase";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!secret || secret !== process.env.CLEANUP_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data, error } = await db
    .from("chat_sessions")
    .delete()
    .lt("updated_at", cutoff.toISOString())
    .select("id");

  if (error) {
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }

  return Response.json({
    deleted_sessions: data?.length ?? 0,
    cutoff_date: cutoff.toISOString(),
  });
}
