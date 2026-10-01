import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Explicit destination (e.g. password recovery) always wins.
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const user = data?.user;
      if (user?.app_metadata?.is_super_admin === true) {
        return NextResponse.redirect(`${origin}/admin`);
      }

      // New signup (Google or email confirmation): send to onboarding until
      // the organization's profile is filled in.
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("organizations(onboarding_completed)")
        .eq("id", user.id)
        .single();

      const onboarded = profile?.organizations?.onboarding_completed !== false;
      return NextResponse.redirect(`${origin}${onboarded ? "/dashboard" : "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
