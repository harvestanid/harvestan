import { createClient } from "@/lib/supabase/server";
import { getDataFilter } from "@/lib/demo/demo-mode";

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

// ✅ Filter user_id + is_demo
export async function getKategoriList(): Promise<Kategori[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const filter = await getDataFilter(user.id);

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const filter = await getDataFilter(user.id);

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .eq("komoditas", komoditas)
    .maybeSingle();

  if (error) {
    console.error("Error getKategoriByKomoditas:", error);
    return null;
  }
  return data as Kategori | null;
}

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

function normalisasiKomoditas(kom: string | null | undefined): string {
  if (!kom) return "padi";
  if (kom === "cabai") return "cabai_rawit";
  return kom;
}

// =============================================================
// Helper hitung produktivitas per komoditas
// ✅ Cabai: aggregate per musim (bukan per panen)
// =============================================================
export function hitungProduktivitasPerKomoditas(
  harvests: any[],
  lands: { id: string; luas: number }[],
  kategoriList: Kategori[]
): ProduktivitasPerKomoditas[] {
  const perKomoditas: Record<string, any[]> = {};

  harvests.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
    const land = lands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    if (!perKomoditas[kom]) perKomoditas[kom] = [];
    perKomoditas[kom].push({ ...h, _landLuas: Number(land.luas) });
  });

  const hasil: ProduktivitasPerKomoditas[] = [];

  Object.entries(perKomoditas).forEach(([kom, panenList]) => {
    const kat = kategoriList.find((k) => k.komoditas === kom) || null;

    // ✅ Khusus cabai: aggregate PER MUSIM
    if (kom === "cabai_rawit") {
      const musimMap = new Map<
        string,
        { totalHasil: number; luasSet: Set<number>; jmlPanen: number }
      >();

      panenList.forEach((h) => {
        const musim = h.musim || "Tanpa Musim";
        if (!musimMap.has(musim)) {
          musimMap.set(musim, { totalHasil: 0, luasSet: new Set(), jmlPanen: 0 });
        }
        const m = musimMap.get(musim)!;
        m.totalHasil += Number(h.hasil_kg);
        if (h._landLuas > 0) m.luasSet.add(h._landLuas);
        m.jmlPanen += 1;
      });

      let totalHasilAll = 0;
      let totalJmlPanen = 0;
      const produktivitasPerMusim: number[] = [];

      musimMap.forEach((m) => {
        const luasMax = Math.max(...Array.from(m.luasSet), 1);
        produktivitasPerMusim.push(m.totalHasil / luasMax);
        totalHasilAll += m.totalHasil;
        totalJmlPanen += m.jmlPanen;
      });

      const rataProduktivitas =
        produktivitasPerMusim.length > 0
          ? produktivitasPerMusim.reduce((s, p) => s + p, 0) /
            produktivitasPerMusim.length
          : 0;

      const terakhir =
        produktivitasPerMusim.length > 0
          ? produktivitasPerMusim[produktivitasPerMusim.length - 1]
          : 0;

      hasil.push({
        komoditas: kom,
        produktivitasTerakhir: terakhir,
        produktivitasRata: rataProduktivitas,
        jmlPanen: totalJmlPanen,
        totalHasilKg: totalHasilAll,
        kategoriTerakhir: hitungKategori(terakhir, kat),
        kategoriRata: hitungKategori(rataProduktivitas, kat),
      });
    } else {
      // Padi/Jagung/Kacang/Bawang: per panen
      let totalHasil = 0;
      let totalProdSum = 0;
      let jmlPanen = 0;
      const panenDetail: { tanggal: string; prod: number }[] = [];

      panenList.forEach((h) => {
        const prod = Number(h.hasil_kg) / h._landLuas;
        totalHasil += Number(h.hasil_kg);
        totalProdSum += prod;
        jmlPanen += 1;
        panenDetail.push({ tanggal: h.tanggal, prod });
      });

      const rata = jmlPanen > 0 ? totalProdSum / jmlPanen : 0;
      const sorted = [...panenDetail].sort(
        (a, b) =>
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );
      const terakhir = sorted[0]?.prod || 0;

      hasil.push({
        komoditas: kom,
        produktivitasTerakhir: terakhir,
        produktivitasRata: rata,
        jmlPanen,
        totalHasilKg: totalHasil,
        kategoriTerakhir: hitungKategori(terakhir, kat),
        kategoriRata: hitungKategori(rata, kat),
      });
    }
  });

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
