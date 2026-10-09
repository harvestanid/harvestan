// ============================================================
// Helper hitung ongkir — multi kurir + multi layanan
// ============================================================

export type ShippingOption = {
  id: string;
  provinsi: string;
  kurir: string;
  layanan: string;
  ongkir_per_kg: number;
  min_berat_kg: number;
  estimasi_hari: string | null;
  urutan: number;
};

export type OngkirCalc = {
  option: ShippingOption;
  berat_kg: number;
  biaya_total: number;
  kurir_label: string;
  layanan_label: string;
  is_termurah: boolean;
};

// ============================================================
// Hitung biaya 1 opsi
// ============================================================
export function hitungBiayaOpsi(
  option: ShippingOption,
  berat_kg: number
): number {
  const beratEfektif =
    option.layanan === "kargo"
      ? Math.max(berat_kg, option.min_berat_kg || 10)
      : berat_kg;

  return option.ongkir_per_kg * Math.ceil(beratEfektif);
}

// ============================================================
// Filter opsi yang valid berdasarkan berat
// ============================================================
export function filterOpsiValid(
  options: ShippingOption[],
  berat_kg: number
): ShippingOption[] {
  return options.filter((o) => {
    if (o.layanan === "kargo") {
      return berat_kg >= (o.min_berat_kg || 10);
    }
    return true;
  });
}

// ============================================================
// Hitung semua opsi + sort dari termurah
// ============================================================
export function hitungSemuaOpsi(
  options: ShippingOption[],
  berat_kg: number
): OngkirCalc[] {
  const valid = filterOpsiValid(options, berat_kg);

  const hasil: OngkirCalc[] = valid.map((o) => ({
    option: o,
    berat_kg,
    biaya_total: hitungBiayaOpsi(o, berat_kg),
    kurir_label: labelKurir(o.kurir),
    layanan_label: labelLayanan(o.layanan),
    is_termurah: false,
  }));

  hasil.sort((a, b) => a.biaya_total - b.biaya_total);

  if (hasil.length > 0) {
    hasil[0].is_termurah = true;
  }

  return hasil;
}

// ============================================================
// Pilih opsi termurah otomatis
// ============================================================
export function pilihTermurah(
  options: ShippingOption[],
  berat_kg: number
): OngkirCalc | null {
  const semua = hitungSemuaOpsi(options, berat_kg);
  return semua[0] || null;
}

// ============================================================
// Label kurir
// ============================================================
export function labelKurir(kurir: string): string {
  const map: Record<string, string> = {
    anteraja: "AnterAja",
    jne: "JNE",
    jnt: "J&T Express",
    sicepat: "SiCepat",
    ninja: "Ninja Xpress",
    pos: "POS Indonesia",
  };
  return map[kurir] || kurir.toUpperCase();
}

export function labelLayanan(layanan: string): string {
  const map: Record<string, string> = {
    reguler: "Reguler",
    kargo: "Kargo",
    express: "Express",
    same_day: "Same Day",
  };
  return map[layanan] || layanan;
}

// ============================================================
// Ikon kurir
// ============================================================
export function ikonKurir(kurir: string): string {
  const map: Record<string, string> = {
    anteraja: "🚚",
    jne: "📦",
    jnt: "🚛",
    sicepat: "⚡",
    ninja: "🥷",
    pos: "📮",
  };
  return map[kurir] || "🚚";
}

// ============================================================
// Ikon layanan
// ============================================================
export function ikonLayanan(layanan: string): string {
  if (layanan === "kargo") return "🏗️";
  if (layanan === "express") return "⚡";
  if (layanan === "same_day") return "🏃";
  return "🚚";
}
