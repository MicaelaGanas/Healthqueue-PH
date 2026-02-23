import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

/** GET: list all announcements (admin). Newest first. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("id, type, title, description, created_at, created_by, hidden")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin announcements GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/** POST: create announcement (admin). Body: { type: 'notice'|'info'|'alert', title, description } */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

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
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 200) : "";
  const description = typeof b.description === "string" ? b.description.trim().slice(0, 2000) : "";

  if (!type) {
    return NextResponse.json({ error: "type must be notice, info, or alert" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  const row = {
    type,
    title,
    description,
    created_by: auth.staff?.name ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("announcements").insert(row).select("id, type, title, description, created_at").single();

  if (error) {
    console.error("admin announcements POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** PATCH: hide/unhide announcements (admin). Body: { ids: string[], hidden: true|false } */
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

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
  const ids = Array.isArray(b.ids) && b.ids.every((x) => typeof x === "string") ? (b.ids as string[]) : [];
  const hidden = typeof b.hidden === "boolean" ? b.hidden : false;

  if (ids.length === 0) {
    return NextResponse.json({ error: "ids array is required and must not be empty" }, { status: 400 });
  }

  const { error } = await supabase.from("announcements").update({ hidden }).in("id", ids);

  if (error) {
    console.error("admin announcements PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
