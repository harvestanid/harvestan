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

// =================================================================
// AKTIVASI PREMIUM (dipakai webhook Mayar)
// =================================================================

export type ActivatePremiumInput = {
  userId: string;
  orderId: string;
  amount: number;
  paymentMethod?: string | null;
  premiumType?: "lifetime" | "barter" | "trial";
  source?: string;
  notes?: string | null;
};

export async function activatePremium(
  input: ActivatePremiumInput
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const {
    userId,
    orderId,
    amount,
    paymentMethod = null,
    premiumType = "lifetime",
    source = "mayar",
    notes = null,
  } = input;

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, payment_id, is_premium")
    .eq("user_id", userId)
    .single();

  if (existing?.payment_id === orderId && existing?.is_premium) {
    return { ok: true, message: "Order sudah diproses sebelumnya" };
  }

  const payload = {
    user_id: userId,
    is_premium: true,
    premium_until: null,
    premium_type: premiumType,
    premium_source: source,
    payment_id: orderId,
    payment_amount: amount,
    payment_method: paymentMethod,
    notes,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("user_id", userId);

    if (error) {
      console.error("activatePremium update error:", error);
      return { ok: false, message: error.message };
    }
  } else {
    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) {
      console.error("activatePremium insert error:", error);
      return { ok: false, message: error.message };
    }
  }

  return { ok: true, message: "Premium berhasil diaktifkan" };
}

// =================================================================
// MAYAR ORDERS — tracking order
// =================================================================

export async function saveMayarOrder(input: {
  orderId: string;
  userId: string;
  mayarTransactionId?: string | null;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  paymentUrl?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("premium_orders").upsert(
    {
      order_id: input.orderId,
      user_id: input.userId,
      amount: input.amount,
      status: input.status,
      updated_at: new Date().toISOString(),
      notes: input.mayarTransactionId
        ? `Mayar transaction: ${input.mayarTransactionId}`
        : null,
    },
    { onConflict: "order_id" }
  );
  if (error) {
    console.error("saveMayarOrder error:", error);
  }
}

export async function getMayarOrderUser(
  orderId: string
): Promise<{ userId: string; amount: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("premium_orders")
    .select("user_id, amount")
    .eq("order_id", orderId)
    .single();

  if (error || !data) return null;
  return { userId: data.user_id, amount: Number(data.amount) };
}

export async function updateMayarOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "failed" | "expired"
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("premium_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_id", orderId);
  if (error) {
    console.error("updateMayarOrderStatus error:", error);
  }
}

export async function findByMayarTransactionId(
  mayarTransactionId: string
): Promise<{ userId: string; orderId: string; amount: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("premium_orders")
    .select("user_id, order_id, amount")
    .ilike("notes", `%${mayarTransactionId}%`)
    .single();

  if (error || !data) return null;
  return {
    userId: data.user_id,
    orderId: data.order_id,
    amount: Number(data.amount),
  };
}
