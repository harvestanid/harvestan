import { createClient } from "@/lib/supabase/server";

export type Feedback = {
  id: string;
  user_id: string;
  rating: number;
  saran_fitur: string | null;
  masukan: string | null;
  is_read: boolean;
  is_pinned: boolean;
  created_at: string;
};

export type FeedbackStats = {
  total: number;
  avgRating: number;
  totalBulanIni: number;
  totalBelumDibaca: number;
  distribusi: {
    bintang1: number;
    bintang2: number;
    bintang3: number;
    bintang4: number;
    bintang5: number;
  };
  perBulan: Array<{
    bulan: string; // "2026-09"
    label: string; // "Sep 2026"
    count: number;
    avgRating: number;
  }>;
};

// ===================================================
// AMBIL SEMUA FEEDBACK (untuk admin)
// ===================================================
export async function getAllFeedback(): Promise<Feedback[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllFeedback error:", error);
    return [];
  }

  return data || [];
}

// ===================================================
// AMBIL STATISTIK FEEDBACK
// ===================================================
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const semua = await getAllFeedback();

  const total = semua.length;
  const avgRating =
    total > 0
      ? semua.reduce((s, f) => s + f.rating, 0) / total
      : 0;

  // Feedback bulan ini
  const now = new Date();
  const bulanIniKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const totalBulanIni = semua.filter((f) => {
    const d = new Date(f.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    return key === bulanIniKey;
  }).length;

  const totalBelumDibaca = semua.filter((f) => !f.is_read).length;

  // Distribusi bintang
  const distribusi = {
    bintang1: 0,
    bintang2: 0,
    bintang3: 0,
    bintang4: 0,
    bintang5: 0,
  };
  semua.forEach((f) => {
    if (f.rating === 1) distribusi.bintang1++;
    else if (f.rating === 2) distribusi.bintang2++;
    else if (f.rating === 3) distribusi.bintang3++;
    else if (f.rating === 4) distribusi.bintang4++;
    else if (f.rating === 5) distribusi.bintang5++;
  });

  // Statistik per bulan (12 bulan terakhir)
  const mapBulan: Record<string, { count: number; totalRating: number }> = {};
  semua.forEach((f) => {
    const d = new Date(f.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!mapBulan[key]) mapBulan[key] = { count: 0, totalRating: 0 };
    mapBulan[key].count++;
    mapBulan[key].totalRating += f.rating;
  });

  // Generate 12 bulan terakhir
  const perBulan: FeedbackStats["perBulan"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = d.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
    const dataBulan = mapBulan[key] || { count: 0, totalRating: 0 };
    perBulan.push({
      bulan: key,
      label,
      count: dataBulan.count,
      avgRating:
        dataBulan.count > 0
          ? dataBulan.totalRating / dataBulan.count
          : 0,
    });
  }

  return {
    total,
    avgRating,
    totalBulanIni,
    totalBelumDibaca,
    distribusi,
    perBulan,
  };
}

// ===================================================
// AMBIL JUMLAH FEEDBACK BELUM DIBACA (untuk badge)
// ===================================================
export async function getUnreadFeedbackCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("feedbacks")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    console.error("getUnreadFeedbackCount error:", error);
    return 0;
  }

  return count || 0;
}
