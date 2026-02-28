import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { requireRoles } from "../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("patient_users")
    .select("id, first_name, last_name, email, number, gender, date_of_birth, address, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Patient",
    email: row.email ?? "",
    phone: row.number ?? "",
    gender: row.gender ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    address: row.address ?? "",
    createdAt: row.created_at ?? "",
  }));

  return NextResponse.json(mapped);
}
