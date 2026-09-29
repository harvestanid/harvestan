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

export type Invoice = {
  id: string;
  invoice_code: string;
  user_id: string;
  user_email: string;
  user_nama: string;
  nominal: number;
  status: "pending" | "approved" | "expired" | "rejected";
  expires_at: string;
  approved_at: string | null;
  approved_by: string | null;
  catatan: string | null;
  created_at: string;
};

export const PAYMENT_INFO = {
  bank: "BCA",
  nomor_rekening: "8691873790",
  nama_pemilik: "Irsyaadul Ibaad",
  whatsapp: "6285162661397",
  whatsapp_display: "085162661397",
  harga: 59000,
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
// AKTIVASI PREMIUM
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
    source = "manual",
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
// INVOICE (TRANSFER MANUAL)
// =================================================================

function generateInvoiceCode(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `INV-${yyyy}${mm}${dd}-${rand}`;
}

export async function expireOldInvoices(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}

export async function getActiveInvoice(
  userId: string
): Promise<Invoice | null> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getActiveInvoice error:", error);
    return null;
  }

  return data;
}

export async function createInvoice(
  userId: string,
  userEmail: string,
  userNama: string
): Promise<{ ok: boolean; invoice?: Invoice; message: string }> {
  const supabase = await createClient();

  await expireOldInvoices();

  const existing = await getActiveInvoice(userId);
  if (existing) {
    return {
      ok: true,
      invoice: existing,
      message: "Pakai invoice yang sudah ada",
    };
  }

  let code = generateInvoiceCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: check } = await supabase
      .from("invoices")
      .select("id")
      .eq("invoice_code", code)
      .maybeSingle();
    if (!check) break;
    code = generateInvoiceCode();
    attempts++;
  }

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_code: code,
      user_id: userId,
      user_email: userEmail,
      user_nama: userNama,
      nominal: PAYMENT_INFO.harga,
      status: "pending",
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("createInvoice error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, invoice: data, message: "Invoice berhasil dibuat" };
}

export async function getInvoiceByCode(
  code: string
): Promise<Invoice | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("invoice_code", code)
    .maybeSingle();

  if (error) {
    console.error("getInvoiceByCode error:", error);
    return null;
  }

  return data;
}

export async function approveInvoice(
  invoiceCode: string,
  adminEmail: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const invoice = await getInvoiceByCode(invoiceCode);
  if (!invoice) {
    return { ok: false, message: "Invoice tidak ditemukan" };
  }

  if (invoice.status === "approved") {
    return { ok: true, message: "Invoice sudah di-approve sebelumnya" };
  }

  if (invoice.status === "expired") {
    return { ok: false, message: "Invoice sudah kadaluarsa" };
  }

  const now = new Date().toISOString();

  const { error: errUpdate } = await supabase
    .from("invoices")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: adminEmail,
    })
    .eq("invoice_code", invoiceCode);

  if (errUpdate) {
    console.error("approveInvoice update error:", errUpdate);
    return { ok: false, message: errUpdate.message };
  }

  const result = await activatePremium({
    userId: invoice.user_id,
    orderId: invoice.invoice_code,
    amount: invoice.nominal,
    paymentMethod: "transfer_bca",
    premiumType: "lifetime",
    source: "manual_transfer",
    notes: `Transfer manual approved by ${adminEmail}`,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, message: "Premium berhasil diaktifkan" };
}

export async function rejectInvoice(
  invoiceCode: string,
  catatan: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "rejected",
      catatan: catatan || "Ditolak oleh admin",
    })
    .eq("invoice_code", invoiceCode);

  if (error) {
    console.error("rejectInvoice error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Invoice ditolak" };
}

export async function getPendingInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();

  await expireOldInvoices();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .in("status", ["pending", "approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getPendingInvoices error:", error);
    return [];
  }

  return data || [];
}

export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getUserInvoices error:", error);
    return [];
  }

  return data || [];
}

// =================================================================
// MAYAR PAYMENT (HIDDEN — disimpan untuk masa depan)
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
