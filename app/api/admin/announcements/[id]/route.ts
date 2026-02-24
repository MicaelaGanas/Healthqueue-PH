import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import { requireRoles } from "../../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

/** PATCH: update one announcement (admin). Body: { type?, title?, description? } */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const type = typeof b.type === "string" && ["notice", "info", "alert"].includes(b.type) ? b.type : null;
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 200) : null;
  const description = typeof b.description === "string" ? b.description.trim().slice(0, 2000) : null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (type !== null) updates.type = type;
  if (title !== null) updates.title = title;
  if (description !== null) updates.description = description;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Provide at least one of type, title, description" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("id", id)
    .select("id, type, title, description, created_at, hidden")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    console.error("admin announcements PATCH [id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
