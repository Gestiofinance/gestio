import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id, organizations(id)")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id || profile?.organizations?.id;
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // "logo", "stamp" or "product"
    const itemId = formData.get("itemId"); // required for "product"

    if (!file || !type) return NextResponse.json({ error: "Fichier ou type manquant" }, { status: 400 });
    if (type === "product" && !itemId) return NextResponse.json({ error: "itemId manquant" }, { status: 400 });

    const ext = file.name.split(".").pop().toLowerCase();
    const bucket = type === "logo" ? "logos" : type === "stamp" ? "stamps" : "products";
    const path = type === "product" ? `${orgId}/${itemId}.${ext}` : `${orgId}/${type}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Try upload — bucket may not exist yet, create it via admin if needed
    let { error: uploadError } = await admin.storage.from(bucket).upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

    // If bucket doesn't exist, try creating it and re-uploading
    if (uploadError?.message?.includes("Bucket not found") || uploadError?.message?.includes("bucket")) {
      await admin.storage.createBucket(bucket, { public: true });
      const retry = await admin.storage.from(bucket).upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });
      uploadError = retry.error;
    }

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    if (type === "product") {
      await admin.from("catalog_items").update({ image_url: url }).eq("id", itemId).eq("organization_id", orgId);
    } else {
      const field = type === "logo" ? "logo_url" : "stamp_url";
      await admin.from("organizations").update({ [field]: url }).eq("id", orgId);
    }

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
