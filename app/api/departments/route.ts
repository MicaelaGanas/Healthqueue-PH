import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase/server";

export type DepartmentRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

/** GET: list active departments, ordered by sort_order then name. Public (used by booking, queue filters, admin forms). */
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("departments")
    .select("id, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("departments GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []) as DepartmentRow[];
  return NextResponse.json(list);
}
