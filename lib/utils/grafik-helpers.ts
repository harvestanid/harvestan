// ===================================================
// Helper untuk persiapan data grafik
// ===================================================

export type HarvestRaw = {
  id: string;
  land_id: string;
  tanggal: string;
  komoditas: string | null;
  hasil_kg: number | string;
};

export type LandRaw = {
  id: string;
  penggarap_id: string;
  nama: string;
  luas: number | string;
};

export type PenggarapRaw = {
  id: string;
  nama: string;
};

// ===================================================
// 1. Data Produksi & Produktivitas per Tanggal (untuk grafik garis)
// ===================================================
export type DataPointPerTanggal = {
  tanggal: string;
  tanggalLabel: string;
  komoditas: string;
  produksi: number; // Kg
  produktivitas: number; // Kg/Ha
};

// Return: { [komoditas]: DataPointPerTanggal[] } — dipisah per komoditas
export function siapkanDataPerTanggal(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  filterPenggarapId?: string | null
): Record<string, DataPointPerTanggal[]> {
  // Filter harvests by penggarap kalau ada
  let filtered = harvests;
  if (filterPenggarapId) {
    const landIds = lands
      .filter((l) => l.penggarap_id === filterPenggarapId)
      .map((l) => l.id);
    filtered = harvests.filter((h) => landIds.includes(h.land_id));
  }

  // Group by komoditas, lalu sort by tanggal
  const perKom: Record<string, DataPointPerTanggal[]> = {};

  filtered.forEach((h) => {
    const kom = h.komoditas || "padi";
    const land = lands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    const produksi = Number(h.hasil_kg);
    const produktivitas = produksi / Number(land.luas);

    if (!perKom[kom]) perKom[kom] = [];

    perKom[kom].push({
      tanggal: h.tanggal,
      tanggalLabel: new Date(h.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }),
      komoditas: kom,
      produksi,
      produktivitas,
    });
  });

  // Sort by tanggal
  Object.keys(perKom).forEach((kom) => {
    perKom[kom].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  });

  return perKom;
}

// ===================================================
// 2. Data Kinerja Penggarap (untuk grafik bar)
// ===================================================
export type DataKinerjaPenggarap = {
  penggarapId: string;
  nama: string;
  rataProduktivitas: number; // Kg/Ha
  jmlPanen: number;
  totalHasilKg: number;
};

// Hanya tampilkan penggarap yang punya data untuk komoditas terpilih
export function siapkanKinerjaPenggarap(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  penggaraps: PenggarapRaw[],
  komoditas: string
): DataKinerjaPenggarap[] {
  const hasil: DataKinerjaPenggarap[] = [];

  penggaraps.forEach((p) => {
    const penggarapLands = lands.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);

    let totalProduktivitas = 0;
    let jmlPanen = 0;
    let totalHasil = 0;

    harvests.forEach((h) => {
      if (!landIds.includes(h.land_id)) return;
      if ((h.komoditas || "padi") !== komoditas) return;

      const land = penggarapLands.find((l) => l.id === h.land_id);
      if (!land || Number(land.luas) <= 0) return;

      const produk = Number(h.hasil_kg) / Number(land.luas);
      totalProduktivitas += produk;
      jmlPanen += 1;
      totalHasil += Number(h.hasil_kg);
    });

    // Hanya tampilkan kalau ada data
    if (jmlPanen > 0) {
      hasil.push({
        penggarapId: p.id,
        nama: p.nama,
        rataProduktivitas: totalProduktivitas / jmlPanen,
        jmlPanen,
        totalHasilKg: totalHasil,
      });
    }
  });

  // Sort by rata produktivitas (tertinggi dulu)
  hasil.sort((a, b) => b.rataProduktivitas - a.rataProduktivitas);

  return hasil;
}

// ===================================================
// 3. Data Produksi & Produktivitas per Penggarap (grafik garis)
// ===================================================
export function siapkanDataPerPenggarap(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  penggarapId: string,
  komoditas?: string | null
): DataPointPerTanggal[] {
  const penggarapLands = lands.filter((l) => l.penggarap_id === penggarapId);
  const landIds = penggarapLands.map((l) => l.id);

  const filtered = harvests.filter((h) => {
    if (!landIds.includes(h.land_id)) return false;
    if (komoditas && (h.komoditas || "padi") !== komoditas) return false;
    return true;
  });

  const hasil: DataPointPerTanggal[] = filtered.map((h) => {
    const land = penggarapLands.find((l) => l.id === h.land_id);
    const luas = land ? Number(land.luas) : 1;
    const produksi = Number(h.hasil_kg);
    return {
      tanggal: h.tanggal,
      tanggalLabel: new Date(h.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }),
      komoditas: h.komoditas || "padi",
      produksi,
      produktivitas: produksi / luas,
    };
  });

  hasil.sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  return hasil;
}

// ===================================================
// 4. Daftar Komoditas yang Punya Data Panen
// ===================================================
export function getKomoditasDenganData(
  harvests: HarvestRaw[],
  filterPenggarapId?: string | null,
  lands?: LandRaw[]
): string[] {
  let filtered = harvests;
  if (filterPenggarapId && lands) {
    const landIds = lands
      .filter((l) => l.penggarap_id === filterPenggarapId)
      .map((l) => l.id);
    filtered = harvests.filter((h) => landIds.includes(h.land_id));
  }

  const set = new Set<string>();
  filtered.forEach((h) => set.add(h.komoditas || "padi"));

  const order = ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"];
  return Array.from(set).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// ===================================================
// 5. Warna per Komoditas
// ===================================================
export const KOMODITAS_COLOR: Record<string, string> = {
  padi: "#27ae60",
  jagung: "#f39c12",
  kacang_tanah: "#8e44ad",
  bawang_merah: "#e74c3c",
  cabai_rawit: "#c0392b",
};

export const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};
