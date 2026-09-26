import { createClient } from "@/lib/supabase/server";

export type Kategori = {
  id: string;
  user_id: string;
  komoditas: string;
  cukup: number | null;
  baik: number | null;
  sangat_baik: number | null;
  created_at: string;
  updated_at: string;
};

export type KategoriInfo = {
  label: string;
  icon: string;
  color: string;
  bg: string;
  kode: string;
};

export type ProduktivitasPerKomoditas = {
  komoditas: string;
  produktivitasTerakhir: number;
  produktivitasRata: number;
  jmlPanen: number;
  totalHasilKg: number;
  kategoriTerakhir: KategoriInfo | null;
  kategoriRata: KategoriInfo | null;
};

export async function getKategoriList(): Promise<Kategori[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("komoditas");

  if (error) {
    console.error("Error getKategoriList:", error);
    return [];
  }
  return (data as Kategori[]) || [];
}

export async function getKategoriByKomoditas(
  komoditas: string
): Promise<Kategori | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("komoditas", komoditas)
    .maybeSingle();

  if (error) {
    console.error("Error getKategoriByKomoditas:", error);
    return null;
  }
  return data as Kategori | null;
}

// Hitung kategori dari produktivitas
export function hitungKategori(
  produktivitas: number,
  kategori: Kategori | null | undefined
): KategoriInfo | null {
  if (!kategori || kategori.cukup === null || kategori.cukup === undefined) {
    return null;
  }

  const cukup = Number(kategori.cukup);
  const baik = kategori.baik !== null ? Number(kategori.baik) : null;
  const sangatBaik =
    kategori.sangat_baik !== null ? Number(kategori.sangat_baik) : null;

  if (sangatBaik !== null && produktivitas >= sangatBaik) {
    return {
      label: "SANGAT BAIK",
      icon: "⭐⭐⭐",
      color: "text-green-800",
      bg: "bg-green-100 border-green-300",
      kode: "sangat_baik",
    };
  }

  if (baik !== null && produktivitas >= baik) {
    return {
      label: "BAIK",
      icon: "⭐⭐",
      color: "text-blue-800",
      bg: "bg-blue-100 border-blue-300",
      kode: "baik",
    };
  }

  if (produktivitas >= cukup) {
    return {
      label: "CUKUP",
      icon: "⭐",
      color: "text-orange-800",
      bg: "bg-orange-100 border-orange-300",
      kode: "cukup",
    };
  }

  return {
    label: "KURANG OPTIMAL",
    icon: "⚠️",
    color: "text-red-800",
    bg: "bg-red-100 border-red-300",
    kode: "kurang",
  };
}

// ===================================================
// HELPER BARU: Hitung produktivitas per komoditas
// (dari list harvests, pisah per komoditas)
// ===================================================
export function hitungProduktivitasPerKomoditas(
  harvests: any[],
  lands: { id: string; luas: number }[],
  kategoriList: Kategori[]
): ProduktivitasPerKomoditas[] {
  // Group harvests per komoditas
  const byKomoditas = new Map<
    string,
    { hasilKg: number; luasTotal: number; tanggal: string; panenList: { tgl: string; prod: number }[] }[]
  >();

  const data: Record<
    string,
    {
      totalHasil: number;
      totalProdSum: number;
      jmlPanen: number;
      panenList: { tanggal: string; prod: number }[];
    }
  > = {};

  harvests.forEach((h) => {
    const kom = h.komoditas || "padi";
    const land = lands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    const prod = Number(h.hasil_kg) / Number(land.luas);

    if (!data[kom]) {
      data[kom] = {
        totalHasil: 0,
        totalProdSum: 0,
        jmlPanen: 0,
        panenList: [],
      };
    }

    data[kom].totalHasil += Number(h.hasil_kg);
    data[kom].totalProdSum += prod;
    data[kom].jmlPanen += 1;
    data[kom].panenList.push({ tanggal: h.tanggal, prod });
  });

  // Build hasil dengan kategori
  const hasil: ProduktivitasPerKomoditas[] = [];

  Object.entries(data).forEach(([kom, d]) => {
    const rata = d.jmlPanen > 0 ? d.totalProdSum / d.jmlPanen : 0;

    // Panen terakhir (dari list ini)
    const sorted = [...d.panenList].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
    const terakhir = sorted[0]?.prod || 0;

    const kat = kategoriList.find((k) => k.komoditas === kom) || null;

    hasil.push({
      komoditas: kom,
      produktivitasTerakhir: terakhir,
      produktivitasRata: rata,
      jmlPanen: d.jmlPanen,
      totalHasilKg: d.totalHasil,
      kategoriTerakhir: hitungKategori(terakhir, kat),
      kategoriRata: hitungKategori(rata, kat),
    });
  });

  // Sort: padi dulu, lalu yang lain
  const order = ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"];
  hasil.sort((a, b) => {
    const ia = order.indexOf(a.komoditas);
    const ib = order.indexOf(b.komoditas);
    if (ia === -1 && ib === -1) return a.komoditas.localeCompare(b.komoditas);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return hasil;
}
