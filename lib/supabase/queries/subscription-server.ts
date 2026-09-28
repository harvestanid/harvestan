import { createClient } from "@/lib/supabase/server";

export type Subscription = {
  id: string;
  user_id: string;
  is_premium: boolean;
  premium_until: string | null;
  premium_type: "free" | "lifetime" | "barter" | "trial" | null;
  premium_source: string | null;
  payment_id: string | null;
  payment_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionStatus = {
  isPremium: boolean;
  isActive: boolean;
  isDemoActive: boolean;
  effectivePremium: boolean;
  expiresAt: string | null;
  type: string | null;
  source: string | null;
  daysRemaining: number | null;
};

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("getUserSubscription error:", error);
    return null;
  }

  return data;
}

export async function checkPremiumStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const supabase = await createClient();

  const { data: demoSession } = await supabase
    .from("demo_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  let isDemoActive = false;
  if (demoSession) {
    const now = Date.now();
    const expiresAt = new Date(demoSession.expires_at).getTime();
    isDemoActive = expiresAt > now;
  }

  const sub = await getUserSubscription(userId);

  if (!sub) {
    return {
      isPremium: false,
      isActive: false,
      isDemoActive,
      effectivePremium: isDemoActive,
      expiresAt: null,
      type: isDemoActive ? "demo" : "free",
      source: isDemoActive ? "demo" : null,
      daysRemaining: null,
    };
  }

  if (!sub.is_premium) {
    return {
      isPremium: false,
      isActive: false,
      isDemoActive,
      effectivePremium: isDemoActive,
      expiresAt: null,
      type: isDemoActive ? "demo" : "free",
      source: isDemoActive ? "demo" : null,
      daysRemaining: null,
    };
  }

  if (!sub.premium_until) {
    return {
      isPremium: true,
      isActive: true,
      isDemoActive,
      effectivePremium: true,
      expiresAt: null,
      type: sub.premium_type || "lifetime",
      source: sub.premium_source,
      daysRemaining: null,
    };
  }

  const now = Date.now();
  const expiresAt = new Date(sub.premium_until).getTime();
  const isActive = expiresAt > now;

  const daysRemaining = isActive
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    isPremium: true,
    isActive,
    isDemoActive,
    effectivePremium: isActive || isDemoActive,
    expiresAt: sub.premium_until,
    type: sub.premium_type || "barter",
    source: sub.premium_source,
    daysRemaining,
  };
}

export const FREE_TIER_LIMITS = {
  MAX_PENGGARAP: 2,
  MAX_LAHAN: 2,
  MAX_PANEN: 2,
} as const;

export async function canUserInput(
  userId: string,
  type: "penggarap" | "lahan" | "panen"
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}> {
  const supabase = await createClient();

  const { data: demoSession } = await supabase
    .from("demo_sessions")
    .select("is_active, expires_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (demoSession) {
    const now = Date.now();
    const expiresAt = new Date(demoSession.expires_at).getTime();
    if (expiresAt > now) {
      return {
        allowed: false,
        reason:
          "Anda sedang dalam MODE DEMO. Tidak bisa input data baru. Klik 'Selesai Demo' untuk kembali ke data Anda.",
      };
    }
  }

  const status = await checkPremiumStatus(userId);

  if (status.isPremium && status.isActive) {
    return { allowed: true };
  }

  if (type === "penggarap") {
    const { count } = await supabase
      .from("penggaraps")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_demo", false);

    const current = count || 0;
    const max = FREE_TIER_LIMITS.MAX_PENGGARAP;

    if (current >= max) {
      return {
        allowed: false,
        reason: `Paket gratis hanya bisa input ${max} penggarap. Upgrade ke premium untuk unlimited.`,
        currentCount: current,
        maxCount: max,
      };
    }
  }

  if (type === "lahan") {
    const { count } = await supabase
      .from("lands")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_demo", false);

    const current = count || 0;
    const max = FREE_TIER_LIMITS.MAX_LAHAN;

    if (current >= max) {
      return {
        allowed: false,
        reason: `Paket gratis hanya bisa input ${max} lahan. Upgrade ke premium untuk unlimited.`,
        currentCount: current,
        maxCount: max,
      };
    }
  }

  if (type === "panen") {
    const { count } = await supabase
      .from("harvests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_demo", false);

    const current = count || 0;
    const max = FREE_TIER_LIMITS.MAX_PANEN;

    if (current >= max) {
      return {
        allowed: false,
        reason: `Paket gratis hanya bisa input ${max} panen. Upgrade ke premium untuk unlimited.`,
        currentCount: current,
        maxCount: max,
      };
    }
  }

  return { allowed: true };
}
