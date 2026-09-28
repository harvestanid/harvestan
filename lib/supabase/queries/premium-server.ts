import { createClient } from "@/lib/supabase/server";

export type PremiumRequest = {
  id: string;
  user_id: string;
  tipe: "social_media" | "referral" | "other";
  platform: string | null;
  link_post: string | null;
  screenshot_url: string | null;
  catatan_user: string | null;
  status: "pending" | "approved" | "rejected";
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

// ===================================================
// AMBIL REQUEST USER
// ===================================================
export async function getUserPremiumRequests(
  userId: string
): Promise<PremiumRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("premium_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserPremiumRequests error:", error);
    return [];
  }

  return data || [];
}

// ===================================================
// CEK APAKAH USER SUDAH PUNYA REQUEST PENDING
// ===================================================
export async function hasPendingRequest(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("premium_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");

  return (count || 0) > 0;
}

// ===================================================
// AMBIL SEMUA REQUEST (ADMIN)
// ===================================================
export async function getAllPremiumRequests(): Promise<PremiumRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("premium_requests")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllPremiumRequests error:", error);
    return [];
  }

  return data || [];
}

// ===================================================
// STATISTIK REQUEST (ADMIN)
// ===================================================
export type PremiumRequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export async function getPremiumRequestStats(): Promise<PremiumRequestStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("premium_requests")
    .select("status");

  const stats: PremiumRequestStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  (data || []).forEach((r) => {
    stats.total++;
    if (r.status === "pending") stats.pending++;
    else if (r.status === "approved") stats.approved++;
    else if (r.status === "rejected") stats.rejected++;
  });

  return stats;
}
