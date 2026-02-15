import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase/server";
import type { DbAdminUser } from "../../../lib/supabase/types";
import { requireRoles } from "../../../lib/api/auth";

function toAppUser(r: DbAdminUser) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    employeeId: r.employee_id,
    createdAt: r.created_at,
  };
}

const requireAdmin = requireRoles(["admin"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(toAppUser));
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const body = await request.json();
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status ?? "active",
      employee_id: body.employeeId,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(toAppUser(data as DbAdminUser));
}
