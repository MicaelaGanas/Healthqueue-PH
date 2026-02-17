import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../../../lib/supabase/server";
import { requireRoles } from "../../../../lib/api/auth";

const requireAdmin = requireRoles(["admin"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email;
  if (body.role !== undefined) update.role = body.role;
  if (body.status !== undefined) update.status = body.status;
  // employeeId is intentionally ignored - it cannot be changed after creation
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }
  const { error } = await supabase
    .from("admin_users")
    .update(update)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Get the user record first to get the email
    const { data: userData, error: fetchError } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user by ID:", id, fetchError);
      return NextResponse.json(
        { error: `Failed to fetch user: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: `User with ID ${id} not found in database` },
        { status: 404 }
      );
    }

    // Delete from admin_users table first
    const { error: deleteError } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting from admin_users:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Delete from auth.users using Supabase Admin API
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && serviceKey) {
      try {
        const supabaseAdmin = createClient(url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        // Try to find and delete the auth user by email
        // Note: listUsers() can be slow with many users, but we'll handle errors gracefully
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error("Error listing auth users (this is non-fatal):", listError.message);
          // Continue - admin_users is already deleted, which is the main goal
        } else if (authUsers?.users) {
          const authUser = authUsers.users.find(u => u.email?.toLowerCase() === userData.email?.toLowerCase());

          if (authUser) {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
            if (authDeleteError) {
              // Log error but don't fail the request since admin_users is already deleted
              console.error(`Failed to delete auth user: ${authDeleteError.message}`);
            } else {
              console.log(`Successfully deleted auth user: ${userData.email}`);
            }
          } else {
            console.log(`Auth user with email ${userData.email} not found in auth.users (may have been deleted already)`);
          }
        }
      } catch (authError) {
        // Log error but don't fail the request since admin_users is already deleted
        console.error("Error deleting auth user:", authError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error in DELETE handler:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
