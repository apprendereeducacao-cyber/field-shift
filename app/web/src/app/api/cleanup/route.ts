import { createAdminClient } from "@/lib/supabase";
import { timingSafeEqual } from "crypto";

export async function DELETE(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CLEANUP_SECRET}`;

  if (
    !process.env.CLEANUP_SECRET ||
    Buffer.byteLength(auth) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  ) {
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
