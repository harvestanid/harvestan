// ===================================================
// DEMO DATA LOADER
// Memuat data demo dari JSON & kalkulasi statistik
// ===================================================

import fs from "fs";
import path from "path";

// ===================================================
// TIPE DATA
// ===================================================
export type DemoPenggarap = {
  id: string;
  nama: string;
  alamat: string;
  usia: number;
  kontak: string;
};

export type DemoLahan = {
  id: string;
  penggarap_id: string;
  nama: string;
  luas: number;
  lokasi_koordinat: string;
};

export type DemoHarvest = {
  id: string;
  land_id: string;
  tanggal: string;
  komoditas: string;
  musim?: string;
  hasil_kg: number;
  harga_gabah: number;
  biaya_panen_per_kg: number;
  bawa_penggarap: number;
  persen_owner: number;
  persen_penggarap: number;
};

export type DemoDebt = {
  id: string;
  penggarap_id: string;
  tanggal: string;
  jumlah: number;
  dibayar: number;
  sisa: number;
  keperluan: string;
};

export type DemoMusim = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
};

export type DemoKategori = {
  komoditas: string;
  cukup: number;
  baik: number;
  sangat_baik: number;
};

export type DemoData = {
  info: {
    nama: string;
    deskripsi: string;
    periode: string;
    total_tahun: number;
  };
  penggarap: DemoPenggarap[];
  lahan: DemoLahan[];
  harvests: DemoHarvest[];
  debts: DemoDebt[];
  musim_cabai: DemoMusim[];
  categories: DemoKategori[];
};

// ===================================================
// STATISTIK DEMO
// ===================================================
export type DemoStats = {
  totalPenggarap: number;
  totalLahan: number;
  totalLuas: number;
  totalPanen: number;
  totalHasilKg: number;
  totalPendapatan: number;
  totalBiaya: number;
  totalProfitBersih: number;
  totalProfitOwner: number;
  totalProfitPenggarap: number;
  rataRataProfitPerTahun: number;
  komoditasTersedia: string[];
  tahunTersedia: number[];
};

// ===================================================
// LOAD DATA DEMO (dari file JSON)
// ===================================================
let cachedData: DemoData | null = null;

export function loadDemoData(): DemoData {
  if (cachedData) return cachedData;

  const filePath = path.join(process.cwd(), "public", "demo-data.json");
  const raw = fs.readFileSync(filePath, "utf8");
  cachedData = JSON.parse(raw) as DemoData;
  return cachedData;
}

// ===================================================
// HITUNG STATISTIK DEMO
// ===================================================
export function hitungDemoStats(data: DemoData): DemoStats {
  const totalPenggarap = data.penggarap.length;
  const totalLahan = data.lahan.length;
  const totalLuas = data.lahan.reduce((s, l) => s + l.luas, 0);
  const totalPanen = data.harvests.length;
  const totalHasilKg = data.harvests.reduce((s, h) => s + h.hasil_kg, 0);

  // Hitung profit per panen (dengan penyesuaian bawa pulang)
  let totalPendapatan = 0;
  let totalBiaya = 0;
  let totalProfitBersih = 0;
  let totalProfitOwner = 0;
  let totalProfitPenggarap = 0;

  data.harvests.forEach((h) => {
    const pendapatan = h.hasil_kg * h.harga_gabah;
    const biaya = h.hasil_kg * h.biaya_panen_per_kg;
    const profit = pendapatan - biaya;

    totalPendapatan += pendapatan;
    totalBiaya += biaya;
    totalProfitBersih += profit;

    // Bagi hasil dasar
    let po = profit * (h.persen_owner / 100);
    let pp = profit * (h.persen_penggarap / 100);

    // Penyesuaian gabah bawa pulang
    const nilaiBawa = h.bawa_penggarap * h.harga_gabah;
    po += nilaiBawa;
    pp -= nilaiBawa;

    totalProfitOwner += po;
    totalProfitPenggarap += pp;
  });

  const totalTahun = data.info.total_tahun;
  const rataRataProfitPerTahun = totalProfitBersih / totalTahun;

  // Komoditas unik
  const komoditasSet = new Set<string>();
  data.harvests.forEach((h) => komoditasSet.add(h.komoditas));
  const komoditasTersedia = Array.from(komoditasSet).sort();

  // Tahun unik
  const tahunSet = new Set<number>();
  data.harvests.forEach((h) => {
    tahunSet.add(new Date(h.tanggal).getFullYear());
  });
  const tahunTersedia = Array.from(tahunSet).sort();

  return {
    totalPenggarap,
    totalLahan,
    totalLuas,
    totalPanen,
    totalHasilKg,
    totalPendapatan,
    totalBiaya,
    totalProfitBersih,
    totalProfitOwner,
    totalProfitPenggarap,
    rataRataProfitPerTahun,
    komoditasTersedia,
    tahunTersedia,
  };
}

// ===================================================
// DATA PANEN PER TANGGAL (untuk grafik)
// ===================================================
export type DataPerTanggal = {
  tanggalLabel: string;
  produksi: number;
  produktivitas: number;
};

export function getDataPerKomoditas(
  komoditas: string
): DataPerTanggal[] {
  const data = loadDemoData();
  const result: DataPerTanggal[] = [];

  data.harvests
    .filter((h) => h.komoditas === komoditas)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .forEach((h) => {
      const land = data.lahan.find((l) => l.id === h.land_id);
      if (!land) return;
      const produktivitas = h.hasil_kg / land.luas;

      result.push({
        tanggalLabel: new Date(h.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        produksi: h.hasil_kg,
        produktivitas: Math.round(produktivitas),
      });
    });

  return result;
}

// ===================================================
// KINERJA PER PENGGARAP (untuk chart)
// ===================================================
export type KinerjaPenggarap = {
  id: string;
  nama: string;
  jmlPanen: number;
  totalHasilKg: number;
  rataProduktivitas: number;
};

export function getKinerjaPenggarap(
  komoditas: string
): KinerjaPenggarap[] {
  const data = loadDemoData();
  const result: KinerjaPenggarap[] = [];

  data.penggarap.forEach((p) => {
    const penggarapLands = data.lahan.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);

    const penggarapHarvests = data.harvests.filter(
      (h) => landIds.includes(h.land_id) && h.komoditas === komoditas
    );

    if (penggarapHarvests.length === 0) return;

    let totalHasil = 0;
    let totalProdSum = 0;

    penggarapHarvests.forEach((h) => {
      const land = penggarapLands.find((l) => l.id === h.land_id);
      if (!land) return;
      totalHasil += h.hasil_kg;
      totalProdSum += h.hasil_kg / land.luas;
    });

    const rataProd = totalProdSum / penggarapHarvests.length;

    result.push({
      id: p.id,
      nama: p.nama,
      jmlPanen: penggarapHarvests.length,
      totalHasilKg: totalHasil,
      rataProduktivitas: rataProd,
    });
  });

  result.sort((a, b) => b.rataProduktivitas - a.rataProduktivitas);
  return result;
}

// ===================================================
// PROFIT PER TAHUN (untuk chart keuangan)
// ===================================================
export type ProfitPerTahun = {
  tahun: string;
  profitOwner: number;
  profitPenggarap: number;
  totalProfit: number;
};

export function getProfitPerTahun(): ProfitPerTahun[] {
  const data = loadDemoData();
  const mapTahun: Record<string, { owner: number; penggarap: number }> = {};

  data.harvests.forEach((h) => {
    const tahun = new Date(h.tanggal).getFullYear().toString();
    if (!mapTahun[tahun]) mapTahun[tahun] = { owner: 0, penggarap: 0 };

    const pendapatan = h.hasil_kg * h.harga_gabah;
    const biaya = h.hasil_kg * h.biaya_panen_per_kg;
    const profit = pendapatan - biaya;

    let po = profit * (h.persen_owner / 100);
    let pp = profit * (h.persen_penggarap / 100);

    const nilaiBawa = h.bawa_penggarap * h.harga_gabah;
    po += nilaiBawa;
    pp -= nilaiBawa;

    mapTahun[tahun].owner += po;
    mapTahun[tahun].penggarap += pp;
  });

  return Object.entries(mapTahun)
    .map(([tahun, val]) => ({
      tahun,
      profitOwner: val.owner,
      profitPenggarap: val.penggarap,
      totalProfit: val.owner + val.penggarap,
    }))
    .sort((a, b) => parseInt(a.tahun) - parseInt(b.tahun));
}

// ===================================================
// DETAIL PER PENGGARAP (untuk tabel)
// ===================================================
export type DetailPenggarap = {
  id: string;
  nama: string;
  alamat: string;
  jmlLahan: number;
  totalLuas: number;
  jmlPanen: number;
  totalHasilKg: number;
  profitOwner: number;
  profitPenggarap: number;
  hutangAktif: number;
};

export function getDetailPerPenggarap(): DetailPenggarap[] {
  const data = loadDemoData();

  return data.penggarap.map((p) => {
    const penggarapLands = data.lahan.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);

    const penggarapHarvests = data.harvests.filter((h) =>
      landIds.includes(h.land_id)
    );

    let totalHasil = 0;
    let profitOwner = 0;
    let profitPenggarap = 0;

    penggarapHarvests.forEach((h) => {
      const pendapatan = h.hasil_kg * h.harga_gabah;
      const biaya = h.hasil_kg * h.biaya_panen_per_kg;
      const profit = pendapatan - biaya;

      let po = profit * (h.persen_owner / 100);
      let pp = profit * (h.persen_penggarap / 100);

      const nilaiBawa = h.bawa_penggarap * h.harga_gabah;
      po += nilaiBawa;
      pp -= nilaiBawa;

      totalHasil += h.hasil_kg;
      profitOwner += po;
      profitPenggarap += pp;
    });

    const totalLuas = penggarapLands.reduce((s, l) => s + l.luas, 0);
    const hutangAktif = data.debts
      .filter((d) => d.penggarap_id === p.id && d.sisa > 0)
      .reduce((s, d) => s + d.sisa, 0);

    return {
      id: p.id,
      nama: p.nama,
      alamat: p.alamat,
      jmlLahan: penggarapLands.length,
      totalLuas,
      jmlPanen: penggarapHarvests.length,
      totalHasilKg: totalHasil,
      profitOwner,
      profitPenggarap,
      hutangAktif,
    };
  });
}
