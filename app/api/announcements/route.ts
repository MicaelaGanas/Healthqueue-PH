import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";

export type AnnouncementRow = {
  id: string;
  type: "notice" | "info" | "alert";
  title: string;
  description: string;
  created_at: string;
};

/** GET: public list of announcements, newest first. No auth. */
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("id, type, title, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("announcements GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []) as AnnouncementRow[];
  return NextResponse.json(list);
}
