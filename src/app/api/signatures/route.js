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
  return { user, admin, orgId };
}

async function withSignedUrls(admin, doc) {
  const [original, signed] = await Promise.all([
    admin.storage.from(BUCKET).createSignedUrl(doc.original_path, 3600),
    doc.signed_path
      ? admin.storage.from(BUCKET).createSignedUrl(doc.signed_path, 3600)
      : Promise.resolve({ data: null }),
  ]);
  return {
    ...doc,
    original_url: original.data?.signedUrl || null,
    signed_url: signed.data?.signedUrl || null,
  };
}

// GET — liste des documents à signer / signés de l'organisation
export async function GET() {
  try {
    const { admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ documents: [] });

    const { data, error: fetchError } = await admin
      .from("signed_documents")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (fetchError) throw fetchError;

    const documents = await Promise.all((data || []).map((doc) => withSignedUrls(admin, doc)));
    return NextResponse.json({ documents });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — importer un nouveau document PDF
export async function POST(request) {
  try {
    const { user, admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const id = crypto.randomUUID();
    const path = `${orgId}/${id}/original.pdf`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: doc, error: insertError } = await admin
      .from("signed_documents")
      .insert({
        id,
        organization_id: orgId,
        created_by: user.id,
        name: file.name,
        original_path: path,
        status: "draft",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return NextResponse.json({ document: await withSignedUrls(admin, doc) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
