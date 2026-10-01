import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TRIAL_DAYS = 14;

export async function getTrialDays() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "trial_days")
      .single();
    const days = parseInt(data?.value, 10);
    return Number.isFinite(days) && days > 0 ? days : DEFAULT_TRIAL_DAYS;
  } catch {
    return DEFAULT_TRIAL_DAYS;
  }
}
