import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "signed-documents";

async function getOrgIdForUser() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, organizations(id)")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id || profile?.organizations?.id;
  return { admin, orgId };
}

// PATCH — envoyer la version signée finale du document
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { data: doc } = await admin
      .from("signed_documents")
      .select("id")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const path = `${orgId}/${id}/signed.pdf`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: updated, error: updateError } = await admin
      .from("signed_documents")
      .update({ signed_path: path, status: "signed" })
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { data: signedUrl } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
    return NextResponse.json({ document: { ...updated, signed_url: signedUrl?.signedUrl || null } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — supprimer un document (fichiers + ligne)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { data: doc } = await admin
      .from("signed_documents")
      .select("original_path, signed_path")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const paths = [doc.original_path, doc.signed_path].filter(Boolean);
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);

    const { error: deleteError } = await admin
      .from("signed_documents")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
