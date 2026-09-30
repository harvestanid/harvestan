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
  user_whatsapp: string | null;
  nominal: number;
  status: "pending" | "approved" | "expired" | "rejected";
  expires_at: string;
  approved_at: string | null;
  approved_by: string | null;
  notif_approved_sent: boolean | null;
  notif_rejected_sent: boolean | null;
  catatan: string | null;
  is_testing: boolean;
  created_at: string;
};

export type InvoiceStats = {
  total_invoices: number;
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  total_expired: number;
  total_testing: number;
  revenue_total: number;
  revenue_this_month: number;
  revenue_this_year: number;
  revenue_testing_total: number;
  premium_users: number;
};

export type Order = {
  id: string;
  order_code: string;
  user_id: string;
  user_email: string;
  user_nama: string;
  items: Array<{
    product_id: string;
    nama_produk: string;
    harga: number;
    qty: number;
    satuan: string;
    subtotal: number;
    foto_url: string | null;
  }>;
  subtotal: number;
  ongkir: number;
  total: number;
  nama_penerima: string;
  no_hp: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kode_pos: string | null;
  kurir: string | null;
  layanan_kurir: string | null;
  estimasi_hari: string | null;
  catatan: string | null;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "expired"
    | "dikirim"
    | "selesai";
  expires_at: string;
  approved_at: string | null;
  approved_by: string | null;
  resi: string | null;
  kurir_resi: string | null;
  catatan_admin: string | null;
  created_at: string;
};

export type OrderStats = {
  total_orders: number;
  total_pending: number;
  total_approved: number;
  total_dikirim: number;
  total_selesai: number;
  total_rejected: number;
  total_expired: number;
  revenue_this_month: number;
  revenue_total: number;
};

export type SubscriptionWithUser = Subscription & {
  user_email: string | null;
  user_nama: string | null;
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
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

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

export async function revokePremium(
  userId: string,
  adminEmail: string,
  alasan?: string | null
): Promise<{ ok: boolean; message: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, is_premium")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    return { ok: false, message: "User tidak punya subscription" };
  }

  if (!existing.is_premium) {
    return { ok: true, message: "User sudah bukan premium" };
  }

  const notesText = alasan
    ? `Revoked by ${adminEmail}: ${alasan}`
    : `Revoked by ${adminEmail}`;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      is_premium: false,
      premium_until: null,
      premium_type: "free",
      premium_source: "revoked_by_admin",
      notes: notesText,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("revokePremium error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Premium berhasil dicabut" };
}

export async function getAllSubscriptions(filters?: {
  status?: "all" | "premium" | "free";
  search?: string;
}): Promise<SubscriptionWithUser[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  let query = supabase
    .from("subscriptions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (filters?.status === "premium") {
    query = query.eq("is_premium", true);
  } else if (filters?.status === "free") {
    query = query.eq("is_premium", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAllSubscriptions error:", error);
    return [];
  }

  const subs = (data || []) as Subscription[];

  const userIds = subs.map((s) => s.user_id);

  let invoiceInfo: Record<
    string,
    { email: string | null; nama: string | null }
  > = {};

  if (userIds.length > 0) {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("user_id, user_email, user_nama")
      .in("user_id", userIds);

    (invoices || []).forEach((inv) => {
      if (!invoiceInfo[inv.user_id]) {
        invoiceInfo[inv.user_id] = {
          email: inv.user_email,
          nama: inv.user_nama,
        };
      }
    });
  }

  let result: SubscriptionWithUser[] = subs.map((s) => ({
    ...s,
    user_email: invoiceInfo[s.user_id]?.email || null,
    user_nama: invoiceInfo[s.user_id]?.nama || null,
  }));

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (s) =>
        (s.user_email || "").toLowerCase().includes(q) ||
        (s.user_nama || "").toLowerCase().includes(q) ||
        s.user_id.toLowerCase().includes(q)
    );
  }

  return result;
}

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
      is_testing: false,
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
    notes: `Transfer bank approved by ${adminEmail}`,
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

export async function toggleInvoiceTesting(
  invoiceCode: string,
  isTesting: boolean
): Promise<{ ok: boolean; message: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("invoices")
    .update({ is_testing: isTesting })
    .eq("invoice_code", invoiceCode);

  if (error) {
    console.error("toggleInvoiceTesting error:", error);
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: isTesting
      ? "Invoice ditandai TESTING (tidak masuk revenue)"
      : "Invoice kembali normal (masuk revenue)",
  };
}

// ✅ BARU: Hapus 1 invoice
export async function deleteInvoice(
  invoiceCode: string
): Promise<{ ok: boolean; message: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("invoice_code", invoiceCode);

  if (error) {
    console.error("deleteInvoice error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Invoice berhasil dihapus" };
}

// ✅ BARU: Hapus semua invoice testing
export async function deleteAllTestingInvoices(): Promise<{
  ok: boolean;
  message: string;
  count?: number;
}> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: list, error: errFetch } = await supabase
    .from("invoices")
    .select("id")
    .eq("is_testing", true);

  if (errFetch) {
    console.error("deleteAllTestingInvoices fetch error:", errFetch);
    return { ok: false, message: errFetch.message };
  }

  const count = (list || []).length;

  if (count === 0) {
    return { ok: true, message: "Tidak ada invoice testing", count: 0 };
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("is_testing", true);

  if (error) {
    console.error("deleteAllTestingInvoices error:", error);
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: `${count} invoice testing berhasil dihapus`,
    count,
  };
}

export async function getPendingInvoices(filters?: {
  status?: string;
  search?: string;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}): Promise<Invoice[]> {
  const supabase = await createClient();

  await expireOldInvoices();

  let query = supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  } else {
    query = query.in("status", ["pending", "approved", "rejected"]);
  }

  if (filters?.tanggal_dari) {
    query = query.gte("created_at", filters.tanggal_dari);
  }

  if (filters?.tanggal_sampai) {
    query = query.lte("created_at", filters.tanggal_sampai);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPendingInvoices error:", error);
    return [];
  }

  let result = data || [];

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (inv) =>
        inv.invoice_code.toLowerCase().includes(q) ||
        inv.user_nama.toLowerCase().includes(q) ||
        inv.user_email.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();

  await expireOldInvoices();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("getAllInvoices error:", error);
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

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const supabase = await createClient();

  await expireOldInvoices();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("status, nominal, approved_at, created_at, is_testing");

  const all = invoices || [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let revenue_total = 0;
  let revenue_this_month = 0;
  let revenue_this_year = 0;
  let revenue_testing_total = 0;

  all.forEach((inv) => {
    if (inv.status !== "approved") return;

    if (inv.is_testing) {
      revenue_testing_total += Number(inv.nominal);
      return;
    }

    revenue_total += Number(inv.nominal);
    const approvedDate = inv.approved_at ? new Date(inv.approved_at) : null;
    if (approvedDate) {
      if (approvedDate >= startOfMonth) {
        revenue_this_month += Number(inv.nominal);
      }
      if (approvedDate >= startOfYear) {
        revenue_this_year += Number(inv.nominal);
      }
    }
  });

  const { count: premium_users } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);

  return {
    total_invoices: all.length,
    total_pending: all.filter((i) => i.status === "pending").length,
    total_approved: all.filter((i) => i.status === "approved").length,
    total_rejected: all.filter((i) => i.status === "rejected").length,
    total_expired: all.filter((i) => i.status === "expired").length,
    total_testing: all.filter((i) => i.is_testing).length,
    revenue_total,
    revenue_this_month,
    revenue_this_year,
    revenue_testing_total,
    premium_users: premium_users || 0,
  };
}

// =================================================================
// ORDERS (Katalog)
// =================================================================

export async function expireOldOrders(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", code)
    .maybeSingle();

  if (error) {
    console.error("getOrderByCode error:", error);
    return null;
  }

  return data;
}

export async function getOrdersList(filters?: {
  status?: string;
  search?: string;
}): Promise<Order[]> {
  const supabase = await createClient();

  await expireOldOrders();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getOrdersList error:", error);
    return [];
  }

  let result = (data || []) as Order[];

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (o) =>
        o.order_code.toLowerCase().includes(q) ||
        o.user_nama.toLowerCase().includes(q) ||
        o.user_email.toLowerCase().includes(q) ||
        o.nama_penerima.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function approveOrder(
  orderCode: string,
  adminEmail: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const order = await getOrderByCode(orderCode);
  if (!order) {
    return { ok: false, message: "Pesanan tidak ditemukan" };
  }

  if (order.status === "approved") {
    return { ok: true, message: "Pesanan sudah di-approve" };
  }

  if (order.status === "expired") {
    return { ok: false, message: "Pesanan sudah kadaluarsa" };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: adminEmail,
    })
    .eq("order_code", orderCode);

  if (error) {
    console.error("approveOrder error:", error);
    return { ok: false, message: error.message };
  }

  for (const item of order.items || []) {
    if (!item.product_id) continue;

    const { data: p } = await supabase
      .from("products")
      .select("stok, total_terjual")
      .eq("id", item.product_id)
      .single();

    if (p) {
      const newStok = Math.max(0, Number(p.stok) - Number(item.qty));
      const newTerjual = Number(p.total_terjual || 0) + Number(item.qty);

      await supabase
        .from("products")
        .update({
          stok: newStok,
          total_terjual: newTerjual,
          status: newStok <= 0 ? "sold_out" : "aktif",
          updated_at: now,
        })
        .eq("id", item.product_id);
    }
  }

  return { ok: true, message: "Pesanan disetujui" };
}

export async function rejectOrder(
  orderCode: string,
  catatan: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "rejected",
      catatan_admin: catatan || "Ditolak oleh admin",
    })
    .eq("order_code", orderCode);

  if (error) {
    console.error("rejectOrder error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Pesanan ditolak" };
}

export async function updateOrderResi(
  orderCode: string,
  resi: string,
  kurirResi: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "dikirim",
      resi,
      kurir_resi: kurirResi || "JNE",
    })
    .eq("order_code", orderCode);

  if (error) {
    console.error("updateOrderResi error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Resi disimpan" };
}

export async function markOrderSelesai(
  orderCode: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "selesai" })
    .eq("order_code", orderCode);

  if (error) {
    console.error("markOrderSelesai error:", error);
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Pesanan selesai" };
}

export async function getOrderStats(): Promise<OrderStats> {
  const supabase = await createClient();

  await expireOldOrders();

  const { data: orders } = await supabase
    .from("orders")
    .select("status, total, approved_at, created_at");

  const all = orders || [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let revenue_total = 0;
  let revenue_this_month = 0;

  all.forEach((o) => {
    if (o.status === "rejected" || o.status === "expired") return;
    if (o.status === "pending") return;
    revenue_total += Number(o.total);
    const approvedDate = o.approved_at ? new Date(o.approved_at) : null;
    if (approvedDate && approvedDate >= startOfMonth) {
      revenue_this_month += Number(o.total);
    }
  });

  return {
    total_orders: all.length,
    total_pending: all.filter((o) => o.status === "pending").length,
    total_approved: all.filter((o) => o.status === "approved").length,
    total_dikirim: all.filter((o) => o.status === "dikirim").length,
    total_selesai: all.filter((o) => o.status === "selesai").length,
    total_rejected: all.filter((o) => o.status === "rejected").length,
    total_expired: all.filter((o) => o.status === "expired").length,
    revenue_this_month,
    revenue_total,
  };
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getUserOrders error:", error);
    return [];
  }

  return data || [];
}

// =================================================================
// MAYAR
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
