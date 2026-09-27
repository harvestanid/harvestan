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
  expiresAt: string | null;
  type: string | null;
  source: string | null;
  daysRemaining: number | null;
};

// ===================================================
// AMBIL SUBSCRIPTION USER (single)
// ===================================================
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

// ===================================================
// CEK STATUS PREMIUM USER (dipanggil di layout)
// ===================================================
export async function checkPremiumStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const sub = await getUserSubscription(userId);

  // Kalau tidak ada subscription (user lama), treat sebagai free
  if (!sub) {
    return {
      isPremium: false,
      isActive: false,
      expiresAt: null,
      type: "free",
      source: null,
      daysRemaining: null,
    };
  }

  // Kalau is_premium = false, langsung return free
  if (!sub.is_premium) {
    return {
      isPremium: false,
      isActive: false,
      expiresAt: null,
      type: "free",
      source: null,
      daysRemaining: null,
    };
  }

  // Kalau premium_until = null → lifetime
  if (!sub.premium_until) {
    return {
      isPremium: true,
      isActive: true,
      expiresAt: null,
      type: sub.premium_type || "lifetime",
      source: sub.premium_source,
      daysRemaining: null,
    };
  }

  // Kalau ada premium_until, cek apakah masih berlaku
  const now = Date.now();
  const expiresAt = new Date(sub.premium_until).getTime();
  const isActive = expiresAt > now;

  const daysRemaining = isActive
    ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    isPremium: true,
    isActive,
    expiresAt: sub.premium_until,
    type: sub.premium_type || "barter",
    source: sub.premium_source,
    daysRemaining,
  };
}

// ===================================================
// HITUNG LIMIT FREE TIER
// ===================================================
export const FREE_TIER_LIMITS = {
  MAX_PENGGARAP: 2,
  MAX_LAHAN: 2,
  MAX_PANEN: 2, // total di semua lahan
} as const;

// ===================================================
// CEK APAKAH USER BISA INPUT LAGI (free tier)
// ===================================================
export async function canUserInput(
  userId: string,
  type: "penggarap" | "lahan" | "panen"
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}> {
  const status = await checkPremiumStatus(userId);

  // Premium → bebas
  if (status.isPremium && status.isActive) {
    return { allowed: true };
  }

  // Free tier → cek limit
  const supabase = await createClient();

  if (type === "penggarap") {
    const { count } = await supabase
      .from("penggaraps")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

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
      .eq("user_id", userId);

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
      .eq("user_id", userId);

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
