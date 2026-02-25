import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase/server";

const AVATARS_BUCKET = "avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/upload-avatar
 * Uploads a profile photo to Supabase Storage (avatars bucket).
 * Requires: Authorization: Bearer <access_token>
 * Body: multipart/form-data with field "file" (image file)
 * Query or body (JSON): type = "staff" | "patient" (optional, for filename prefix)
 * Returns: { url: string } or error.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabaseAuth = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user?.id) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Server storage not configured" }, { status: 503 });
  }

  let file: File;
  let prefix = "user";
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const f = formData.get("file");
      const t = formData.get("type");
      if (t && typeof t === "string" && (t === "staff" || t === "patient")) prefix = t;
      if (!f || !(f instanceof File)) {
        return NextResponse.json({ error: "Missing file in form field 'file'" }, { status: 400 });
      }
      file = f;
    } else {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, GIF, or WebP." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
  const path = `${prefix}_${user.id}.${safeExt}`;

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasAvatars = buckets?.some((b) => b.name === AVATARS_BUCKET);
    if (!hasAvatars) {
      await supabase.storage.createBucket(AVATARS_BUCKET, { public: true });
    }
  } catch (createErr) {
    // Bucket may already exist or name taken; try upload anyway
  }

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, await file.arrayBuffer(), { upsert: true, contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 400 });
  }
  const publicUrl = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(data.path).data.publicUrl;
  return NextResponse.json({ url: publicUrl });
}
