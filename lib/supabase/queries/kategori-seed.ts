import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_KATEGORI } from "@/lib/kategori/defaults";

// Isi standar KPI default untuk user yang belum punya baris.
// KPI bersifat per-user (unik: user_id + komoditas), jadi is_demo diabaikan.
// Baris yang sudah ada TIDAK diubah (biar setting custom tetap aman).
export async function seedKategoriDefaults(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: existing, error } = await admin
      .from("categories")
      .select("komoditas")
      .eq("user_id", userId);

    if (error) {
      console.error("seedKategoriDefaults: gagal cek existing:", error);
      return;
    }

    const sudahAda = new Set(
      (existing || []).map((r: { komoditas: string }) => r.komoditas)
    );

    const missing = DEFAULT_KATEGORI.filter(
      (k) => !sudahAda.has(k.komoditas)
    ).map((k) => ({
      user_id: userId,
      komoditas: k.komoditas,
      cukup: k.cukup,
      baik: k.baik,
      sangat_baik: k.sangat_baik,
      is_demo: false,
    }));

    if (missing.length === 0) return;

    const { error: insertErr } = await admin
      .from("categories")
      .insert(missing);

    if (insertErr) {
      console.error("seedKategoriDefaults: gagal insert:", insertErr);
    }
  } catch (err) {
    console.error("seedKategoriDefaults error:", err);
  }
}
