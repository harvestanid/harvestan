// ===================================================
// DEFAULT STANDAR KPI PER KOMODITAS
// Dipakai untuk seed akun baru, login Google baru,
// demo, dan fallback tampilan Pengaturan.
// ===================================================

export type KategoriDefault = {
  komoditas: string;
  cukup: number;
  baik: number;
  sangat_baik: number;
};

export const DEFAULT_KATEGORI: KategoriDefault[] = [
  { komoditas: "padi", cukup: 5000, baik: 6000, sangat_baik: 7000 },
  { komoditas: "jagung", cukup: 5000, baik: 6500, sangat_baik: 8000 },
  { komoditas: "kacang_tanah", cukup: 1000, baik: 1500, sangat_baik: 2000 },
  { komoditas: "bawang_merah", cukup: 10000, baik: 12000, sangat_baik: 14000 },
  { komoditas: "cabai_rawit", cukup: 8000, baik: 10000, sangat_baik: 12000 },
];

export function getDefaultKategori(
  komoditas: string
): KategoriDefault | null {
  return DEFAULT_KATEGORI.find((k) => k.komoditas === komoditas) || null;
}
