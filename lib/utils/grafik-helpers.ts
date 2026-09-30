// ===================================================
// Helper untuk persiapan data grafik
// ===================================================

export type HarvestRaw = {
  id: string;
  land_id: string;
  tanggal: string;
  komoditas: string | null;
  hasil_kg: number | string;
  harga_gabah?: number | string;
  harga_per_kg?: number | string;
  musim?: string | null;
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

export function normalisasiKomoditas(kom: string | null | undefined): string {
  if (!kom) return "padi";
  if (kom === "cabai") return "cabai_rawit";
  return kom;
}

// ===================================================
// 1. Data Produksi & Produktivitas per Tanggal
// ===================================================
export type DataPointPerTanggal = {
  tanggal: string;
  tanggalLabel: string;
  komoditas: string;
  produksi: number;
  produktivitas: number;
};

export function siapkanDataPerTanggal(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  filterPenggarapId?: string | null
): Record<string, DataPointPerTanggal[]> {
  let filtered = harvests;
  if (filterPenggarapId) {
    const landIds = lands
      .filter((l) => l.penggarap_id === filterPenggarapId)
      .map((l) => l.id);
    filtered = harvests.filter((h) => landIds.includes(h.land_id));
  }

  const nonCabai: HarvestRaw[] = [];
  const cabai: HarvestRaw[] = [];

  filtered.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
    if (kom === "cabai_rawit") cabai.push(h);
    else nonCabai.push(h);
  });

  const perKom: Record<string, DataPointPerTanggal[]> = {};

  nonCabai.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
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

  if (cabai.length > 0) {
    const musimMap = new Map<
      string,
      {
        totalHasil: number;
        luasSet: Set<number>;
        tanggalAkhir: string;
      }
    >();

    cabai.forEach((h) => {
      const musim = h.musim || "Tanpa Musim";
      const land = lands.find((l) => l.id === h.land_id);
      const luas = land ? Number(land.luas) : 0;

      if (!musimMap.has(musim)) {
        musimMap.set(musim, {
          totalHasil: 0,
          luasSet: new Set(),
          tanggalAkhir: h.tanggal,
        });
      }
      const m = musimMap.get(musim)!;
      m.totalHasil += Number(h.hasil_kg);
      if (luas > 0) m.luasSet.add(luas);
      if (new Date(h.tanggal).getTime() > new Date(m.tanggalAkhir).getTime()) {
        m.tanggalAkhir = h.tanggal;
      }
    });

    perKom["cabai_rawit"] = [];

    musimMap.forEach((m) => {
      const luas = Math.max(...Array.from(m.luasSet), 1);
      const produksi = m.totalHasil;
      const produktivitas = produksi / luas;

      perKom["cabai_rawit"].push({
        tanggal: m.tanggalAkhir,
        tanggalLabel: new Date(m.tanggalAkhir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        }),
        komoditas: "cabai_rawit",
        produksi,
        produktivitas,
      });
    });
  }

  Object.keys(perKom).forEach((kom) => {
    perKom[kom].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  });

  return perKom;
}

// ===================================================
// ✅ Multi-Komoditas: baris per baris (row-based)
// ===================================================
export type BarisMulti = {
  tanggal: string;
  timestamp: number;
  komoditas: string;
  nilai: number;
};

export function siapkanDataMultiKomoditas(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  penggarapId: string,
  mode: "produksi" | "produktivitas"
): BarisMulti[] {
  const penggarapLands = lands.filter((l) => l.penggarap_id === penggarapId);
  const landIds = penggarapLands.map((l) => l.id);

  const filtered = harvests.filter((h) => landIds.includes(h.land_id));

  const nonCabai: HarvestRaw[] = [];
  const cabai: HarvestRaw[] = [];

  filtered.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
    if (kom === "cabai_rawit") cabai.push(h);
    else nonCabai.push(h);
  });

  const baris: BarisMulti[] = [];

  nonCabai.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
    const land = penggarapLands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    const produksi = Number(h.hasil_kg);
    const produktivitas = produksi / Number(land.luas);
    const nilai = mode === "produksi" ? produksi : produktivitas;

    baris.push({
      tanggal: h.tanggal,
      timestamp: new Date(h.tanggal).getTime(),
      komoditas: kom,
      nilai,
    });
  });

  if (cabai.length > 0) {
    const musimMap = new Map<
      string,
      {
        totalHasil: number;
        luasSet: Set<number>;
        tanggalAkhir: string;
      }
    >();

    cabai.forEach((h) => {
      const musim = h.musim || "Tanpa Musim";
      const land = penggarapLands.find((l) => l.id === h.land_id);
      const luas = land ? Number(land.luas) : 0;

      if (!musimMap.has(musim)) {
        musimMap.set(musim, {
          totalHasil: 0,
          luasSet: new Set(),
          tanggalAkhir: h.tanggal,
        });
      }
      const m = musimMap.get(musim)!;
      m.totalHasil += Number(h.hasil_kg);
      if (luas > 0) m.luasSet.add(luas);
      if (new Date(h.tanggal).getTime() > new Date(m.tanggalAkhir).getTime()) {
        m.tanggalAkhir = h.tanggal;
      }
    });

    musimMap.forEach((m) => {
      const luas = Math.max(...Array.from(m.luasSet), 1);
      const produksi = m.totalHasil;
      const produktivitas = produksi / luas;
      const nilai = mode === "produksi" ? produksi : produktivitas;

      baris.push({
        tanggal: m.tanggalAkhir,
        timestamp: new Date(m.tanggalAkhir).getTime(),
        komoditas: "cabai_rawit",
        nilai,
      });
    });
  }

  baris.sort((a, b) => a.timestamp - b.timestamp);

  return baris;
}

// ===================================================
// ✅ BARU: Data Harga per Bulan (non-cabai) & per Musim (cabai)
// ===================================================
export type BarisHarga = {
  tanggal: string;
  timestamp: number;
  labelBulan: string; // untuk agregasi di chart, format "2026-01"
  komoditas: string;
  harga: number;
};

export function siapkanDataHargaPerBulan(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  filterPenggarapId?: string | null
): Record<string, BarisHarga[]> {
  let filtered = harvests;
  if (filterPenggarapId) {
    const landIds = lands
      .filter((l) => l.penggarap_id === filterPenggarapId)
      .map((l) => l.id);
    filtered = harvests.filter((h) => landIds.includes(h.land_id));
  }

  const nonCabai: HarvestRaw[] = [];
  const cabai: HarvestRaw[] = [];

  filtered.forEach((h) => {
    const kom = normalisasiKomoditas(h.komoditas);
    if (kom === "cabai_rawit") cabai.push(h);
    else nonCabai.push(h);
  });

  const perKom: Record<string, BarisHarga[]> = {};

  // ===== Non-cabai: agregasi per bulan =====
  const nonCabaiPerBulan: Record<
    string, // key: `${kom}-${YYYY-MM}`
    { komoditas: string; total: number; jml: number; tanggal: string }
  > = {};

  nonCabai.forEach((h) => {
    const harga = Number(h.harga_per_kg ?? h.harga_gabah ?? 0);
    if (harga <= 0) return;

    const kom = normalisasiKomoditas(h.komoditas);
    const d = new Date(h.tanggal);
    const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const key = `${kom}-${yyyymm}`;

    if (!nonCabaiPerBulan[key]) {
      nonCabaiPerBulan[key] = {
        komoditas: kom,
        total: 0,
        jml: 0,
        tanggal: h.tanggal,
      };
    }
    const entry = nonCabaiPerBulan[key];
    entry.total += harga;
    entry.jml += 1;
    // Simpan tanggal yang paling baru di bulan itu (untuk titik X di chart)
    if (new Date(h.tanggal).getTime() > new Date(entry.tanggal).getTime()) {
      entry.tanggal = h.tanggal;
    }
  });

  Object.entries(nonCabaiPerBulan).forEach(([key, entry]) => {
    const [kom, yyyymm] = key.split("-");
    const hargaRata = entry.jml > 0 ? entry.total / entry.jml : 0;

    if (!perKom[entry.komoditas]) perKom[entry.komoditas] = [];

    perKom[entry.komoditas].push({
      tanggal: entry.tanggal,
      timestamp: new Date(entry.tanggal).getTime(),
      labelBulan: `${kom}-${yyyymm}`,
      komoditas: entry.komoditas,
      harga: hargaRata,
    });
  });

  // ===== Cabai: harga per musim (rata-rata sepanjang musim) =====
  if (cabai.length > 0) {
    const musimMap = new Map<
      string,
      {
        totalHarga: number;
        jml: number;
        tanggalAkhir: string;
      }
    >();

    cabai.forEach((h) => {
      const harga = Number(h.harga_per_kg ?? h.harga_gabah ?? 0);
      if (harga <= 0) return;

      const musim = h.musim || "Tanpa Musim";
      if (!musimMap.has(musim)) {
        musimMap.set(musim, {
          totalHarga: 0,
          jml: 0,
          tanggalAkhir: h.tanggal,
        });
      }
      const m = musimMap.get(musim)!;
      m.totalHarga += harga;
      m.jml += 1;
      if (new Date(h.tanggal).getTime() > new Date(m.tanggalAkhir).getTime()) {
        m.tanggalAkhir = h.tanggal;
      }
    });

    perKom["cabai_rawit"] = [];

    musimMap.forEach((m, musim) => {
      const hargaRata = m.jml > 0 ? m.totalHarga / m.jml : 0;
      perKom["cabai_rawit"].push({
        tanggal: m.tanggalAkhir,
        timestamp: new Date(m.tanggalAkhir).getTime(),
        labelBulan: musim,
        komoditas: "cabai_rawit",
        harga: hargaRata,
      });
    });
  }

  // Sort semua komoditas by tanggal
  Object.keys(perKom).forEach((kom) => {
    perKom[kom].sort((a, b) => a.timestamp - b.timestamp);
  });

  return perKom;
}

// ===================================================
// ✅ BARU: Insight Harga (tren, tertinggi, terendah)
// ===================================================
export type InsightHarga = {
  rataRata: number;
  tertinggi: { harga: number; tanggal: string } | null;
  terendah: { harga: number; tanggal: string } | null;
  trenPersen: number; // + = naik, - = turun (dari bulan terakhir ke sebelumnya)
  trenArah: "naik" | "turun" | "stabil";
};

export function hitungInsightHarga(data: BarisHarga[]): InsightHarga {
  if (data.length === 0) {
    return {
      rataRata: 0,
      tertinggi: null,
      terendah: null,
      trenPersen: 0,
      trenArah: "stabil",
    };
  }

  const total = data.reduce((s, d) => s + d.harga, 0);
  const rataRata = total / data.length;

  let tertinggi = data[0];
  let terendah = data[0];
  data.forEach((d) => {
    if (d.harga > tertinggi.harga) tertinggi = d;
    if (d.harga < terendah.harga) terendah = d;
  });

  // Tren: bandingkan titik terakhir dengan titik sebelumnya
  let trenPersen = 0;
  let trenArah: "naik" | "turun" | "stabil" = "stabil";
  if (data.length >= 2) {
    const last = data[data.length - 1].harga;
    const prev = data[data.length - 2].harga;
    if (prev > 0) {
      trenPersen = ((last - prev) / prev) * 100;
      if (trenPersen > 2) trenArah = "naik";
      else if (trenPersen < -2) trenArah = "turun";
      else trenArah = "stabil";
    }
  }

  return {
    rataRata,
    tertinggi: { harga: tertinggi.harga, tanggal: tertinggi.tanggal },
    terendah: { harga: terendah.harga, tanggal: terendah.tanggal },
    trenPersen,
    trenArah,
  };
}

// ===================================================
// 2. Data Kinerja Penggarap
// ===================================================
export type DataKinerjaPenggarap = {
  penggarapId: string;
  nama: string;
  rataProduktivitas: number;
  jmlPanen: number;
  totalHasilKg: number;
};

export function siapkanKinerjaPenggarap(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  penggaraps: PenggarapRaw[],
  komoditas: string
): DataKinerjaPenggarap[] {
  const hasil: DataKinerjaPenggarap[] = [];
  const komTarget = normalisasiKomoditas(komoditas);

  penggaraps.forEach((p) => {
    const penggarapLands = lands.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);

    if (komTarget === "cabai_rawit") {
      const musimMap = new Map<
        string,
        { totalHasil: number; luasSet: Set<number>; jmlPanen: number }
      >();

      harvests.forEach((h) => {
        if (!landIds.includes(h.land_id)) return;
        if (normalisasiKomoditas(h.komoditas) !== "cabai_rawit") return;

        const musim = h.musim || "Tanpa Musim";
        const land = penggarapLands.find((l) => l.id === h.land_id);
        const luas = land ? Number(land.luas) : 0;

        if (!musimMap.has(musim)) {
          musimMap.set(musim, {
            totalHasil: 0,
            luasSet: new Set(),
            jmlPanen: 0,
          });
        }
        const m = musimMap.get(musim)!;
        m.totalHasil += Number(h.hasil_kg);
        if (luas > 0) m.luasSet.add(luas);
        m.jmlPanen += 1;
      });

      const produktivitasPerMusim: number[] = [];
      let totalHasil = 0;
      let totalJmlPanen = 0;

      musimMap.forEach((m) => {
        const luas = Math.max(...Array.from(m.luasSet), 1);
        produktivitasPerMusim.push(m.totalHasil / luas);
        totalHasil += m.totalHasil;
        totalJmlPanen += m.jmlPanen;
      });

      if (produktivitasPerMusim.length > 0) {
        const rata =
          produktivitasPerMusim.reduce((s, p) => s + p, 0) /
          produktivitasPerMusim.length;
        hasil.push({
          penggarapId: p.id,
          nama: p.nama,
          rataProduktivitas: rata,
          jmlPanen: totalJmlPanen,
          totalHasilKg: totalHasil,
        });
      }
    } else {
      let totalProduktivitas = 0;
      let jmlPanen = 0;
      let totalHasil = 0;

      harvests.forEach((h) => {
        if (!landIds.includes(h.land_id)) return;
        if (normalisasiKomoditas(h.komoditas) !== komTarget) return;

        const land = penggarapLands.find((l) => l.id === h.land_id);
        if (!land || Number(land.luas) <= 0) return;

        const produk = Number(h.hasil_kg) / Number(land.luas);
        totalProduktivitas += produk;
        jmlPanen += 1;
        totalHasil += Number(h.hasil_kg);
      });

      if (jmlPanen > 0) {
        hasil.push({
          penggarapId: p.id,
          nama: p.nama,
          rataProduktivitas: totalProduktivitas / jmlPanen,
          jmlPanen,
          totalHasilKg: totalHasil,
        });
      }
    }
  });

  hasil.sort((a, b) => b.rataProduktivitas - a.rataProduktivitas);

  return hasil;
}

// ===================================================
// 3. Data Produksi & Produktivitas per Penggarap
// ===================================================
export function siapkanDataPerPenggarap(
  harvests: HarvestRaw[],
  lands: LandRaw[],
  penggarapId: string,
  komoditas?: string | null
): DataPointPerTanggal[] {
  const penggarapLands = lands.filter((l) => l.penggarap_id === penggarapId);
  const landIds = penggarapLands.map((l) => l.id);

  const komTarget = komoditas ? normalisasiKomoditas(komoditas) : null;

  const filtered = harvests.filter((h) => {
    if (!landIds.includes(h.land_id)) return false;
    if (komTarget && normalisasiKomoditas(h.komoditas) !== komTarget)
      return false;
    return true;
  });

  if (komTarget === "cabai_rawit") {
    const musimMap = new Map<
      string,
      {
        tanggalAkhir: string;
        totalProduksi: number;
        luasSet: Set<number>;
      }
    >();

    filtered.forEach((h) => {
      const musim = h.musim || "Tanpa Musim";
      const land = penggarapLands.find((l) => l.id === h.land_id);
      const luas = land ? Number(land.luas) : 0;

      if (!musimMap.has(musim)) {
        musimMap.set(musim, {
          tanggalAkhir: h.tanggal,
          totalProduksi: 0,
          luasSet: new Set(),
        });
      }
      const m = musimMap.get(musim)!;
      m.totalProduksi += Number(h.hasil_kg);
      if (luas > 0) m.luasSet.add(luas);
      if (new Date(h.tanggal).getTime() > new Date(m.tanggalAkhir).getTime()) {
        m.tanggalAkhir = h.tanggal;
      }
    });

    const hasil: DataPointPerTanggal[] = [];
    musimMap.forEach((m) => {
      const luas = Math.max(...Array.from(m.luasSet), 1);
      hasil.push({
        tanggal: m.tanggalAkhir,
        tanggalLabel: new Date(m.tanggalAkhir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        }),
        komoditas: "cabai_rawit",
        produksi: m.totalProduksi,
        produktivitas: m.totalProduksi / luas,
      });
    });

    hasil.sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    return hasil;
  }

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
      komoditas: normalisasiKomoditas(h.komoditas),
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
// 4. Daftar Komoditas
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
  filtered.forEach((h) => set.add(normalisasiKomoditas(h.komoditas)));

  const order = [
    "padi",
    "jagung",
    "kacang_tanah",
    "bawang_merah",
    "cabai_rawit",
  ];
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
// 5. Warna & Label
// ===================================================
export const KOMODITAS_COLOR: Record<string, string> = {
  padi: "#27ae60",
  jagung: "#f39c12",
  kacang_tanah: "#8e44ad",
  bawang_merah: "#e74c3c",
  cabai_rawit: "#c0392b",
  cabai: "#c0392b",
};

export const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};
