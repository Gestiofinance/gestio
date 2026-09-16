export function isSubscriptionPeriodExpired(sub) {
  return !!(sub?.current_period_end && new Date(sub.current_period_end) < new Date());
}

// Treats an "active" subscription whose current_period_end has passed as expired,
// even if no webhook has updated the stored status yet.
export function getEffectiveSubscriptionStatus(sub) {
  if (!sub) return null;
  if (sub.status === "active" && isSubscriptionPeriodExpired(sub)) return "expired";
  return sub.status;
}

export function isSubscriptionValid(sub) {
  if (!sub) return false;
  const status = getEffectiveSubscriptionStatus(sub);
  if (status === "active") return true;
  if (status === "trial" && sub.trial_end && new Date(sub.trial_end) > new Date()) return true;
  return false;
}
