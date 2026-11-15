// Per-browser anonymous id for chat sessions. Every visitor must get their own id:
// a shared constant lets anyone list everyone's sessions via /api/chat/sessions.
export function getAnonymousId(): string {
  try {
    const stored = localStorage.getItem("field_shift_anon_id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("field_shift_anon_id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
