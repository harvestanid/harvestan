// =============================================================
// REGEN DEMO DATA — Harvestan v2.0
// Jalankan: node tools/regen-demo.js
// Output: public/demo-data.json (overwrite)
// =============================================================

const fs = require("fs");
const path = require("path");

const TAHUN_MULAI = 2016;
const TAHUN_AKHIR = 2025;
const TAHUN_LIST = [];
for (let t = TAHUN_MULAI; t <= TAHUN_AKHIR; t++) TAHUN_LIST.push(t);

const HARGA = {
  padi: {
    2016: 4200, 2017: 4400, 2018: 4600, 2019: 4800, 2020: 5000,
    2021: 5200, 2022: 5500, 2023: 5800, 2024: 6200, 2025: 6500,
  },
  jagung: {
    2016: 3500, 2017: 3700, 2018: 3900, 2019: 4000, 2020: 4200,
    2021: 4500, 2022: 4800, 2023: 5200, 2024: 5500, 2025: 5800,
  },
  cabai: {
    2016: 25000, 2017: 28000, 2018: 32000, 2019: 30000, 2020: 35000,
    2021: 42000, 2022: 38000, 2023: 45000, 2024: 50000, 2025: 55000,
  },
};

const UMUR = { padi: 110, jagung: 100, cabai: 90 };
const BULAN_MUSIM = { padi: 4, jagung: 4, cabai: 6 };
const UMR_BULANAN = 2500000;

const BIAYA_PANEN = {
  padi:   { 2016: 450, 2025: 650 },
  jagung: { 2016: 380, 2025: 550 },
  cabai:  { 2016: 1200, 2025: 1800 },
};

const BIAYA_MODAL_PER_HA = {
  padi: {
    2016: 6000000, 2018: 7000000, 2020: 7500000, 2022: 8000000,
    2024: 8328050, 2025: 8500000,
  },
  jagung: {
    2016: 4000000, 2018: 4800000, 2020: 5500000, 2022: 6000000,
    2024: 6500000, 2025: 7000000,
  },
  cabai: {
    2016: 25000000, 2018: 28000000, 2020: 32000000, 2022: 35000000,
    2024: 36824166, 2025: 38000000,
  },
};

function biayaModalPerHa(komoditas, tahun) {
  const r = BIAYA_MODAL_PER_HA[komoditas];
  if (!r) return 0;
  const tahunKeys = Object.keys(r).map(Number).sort((a, b) => a - b);
  if (tahun <= tahunKeys[0]) return r[tahunKeys[0]];
  if (tahun >= tahunKeys[tahunKeys.length - 1]) return r[tahunKeys[tahunKeys.length - 1]];
  for (let i = 0; i < tahunKeys.length - 1; i++) {
    const t1 = tahunKeys[i], t2 = tahunKeys[i + 1];
    if (tahun >= t1 && tahun <= t2) {
      const rasio = (tahun - t1) / (t2 - t1);
      return r[t1] + (r[t2] - r[t1]) * rasio;
    }
  }
  return r[tahunKeys[tahunKeys.length - 1]];
}

function biayaPanen(komoditas, tahun) {
  const r = BIAYA_PANEN[komoditas];
  const rasio = (tahun - 2016) / (2025 - 2016);
  return Math.round(r[2016] + (r[2025] - r[2016]) * rasio);
}

const PENGGARAP = [
  { id: "p1",  nama: "Pak Slamet",  alamat: "Dusun Sumberjo",  usia: 58, kontak: "081234567890", luas: 2.0, pola: "padi-jagung", skema: [50, 50], kualitas: 1.15 },
  { id: "p2",  nama: "Pak Budi",    alamat: "Dusun Sumberjo",  usia: 45, kontak: "081234567891", luas: 1.5, pola: "padi",        skema: [50, 50], kualitas: 1.00 },
  { id: "p3",  nama: "Bu Siti",     alamat: "Dusun Ngudi",     usia: 42, kontak: "081234567892", luas: 1.5, pola: "padi-cabai",  skema: [40, 60], kualitas: 1.20 },
  { id: "p4",  nama: "Pak Tarno",   alamat: "Dusun Ngudi",     usia: 50, kontak: "081234567893", luas: 1.0, pola: "padi",        skema: [50, 50], kualitas: 0.85 },
  { id: "p5",  nama: "Pak Yanto",   alamat: "Dusun Sumberjo",  usia: 47, kontak: "081234567894", luas: 1.5, pola: "padi-jagung", skema: [40, 60], kualitas: 1.05 },
  { id: "p6",  nama: "Bu Dewi",     alamat: "Dusun Ngudi",     usia: 38, kontak: "081234567895", luas: 0.8, pola: "padi",        skema: [50, 50], kualitas: 0.75 },
  { id: "p7",  nama: "Pak Hasan",   alamat: "Dusun Sumberjo",  usia: 55, kontak: "081234567896", luas: 1.5, pola: "padi",        skema: [50, 50], kualitas: 1.00 },
  { id: "p8",  nama: "Pak Rahmat",  alamat: "Dusun Ngudi",     usia: 44, kontak: "081234567897", luas: 2.0, pola: "padi-cabai",  skema: [40, 60], kualitas: 1.18 },
  { id: "p9",  nama: "Pak Wawan",   alamat: "Dusun Sumberjo",  usia: 41, kontak: "081234567898", luas: 1.2, pola: "padi-jagung", skema: [30, 70], kualitas: 1.02 },
  { id: "p10", nama: "Bu Rina",     alamat: "Dusun Ngudi",     usia: 36, kontak: "081234567899", luas: 1.0, pola: "padi-jagung", skema: [50, 50], kualitas: 0.90 },
  { id: "p11", nama: "Pak Joko",    alamat: "Dusun Sumberjo",  usia: 52, kontak: "081234567800", luas: 1.3, pola: "padi",        skema: [50, 50], kualitas: 1.00 },
  { id: "p12", nama: "Pak Anto",    alamat: "Dusun Ngudi",     usia: 33, kontak: "081234567801", luas: 0.7, pola: "padi-jagung", skema: [50, 50], kualitas: 0.78 },
  { id: "p13", nama: "Bu Lastri",   alamat: "Dusun Sumberjo",  usia: 40, kontak: "081234567802", luas: 1.0, pola: "padi-cabai",  skema: [40, 60], kualitas: 1.16 },
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pad(n) { return String(n).padStart(2, "0"); }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function genPolygon(centerLat, centerLng, luasHa) {
  const sisi = Math.sqrt(luasHa) * 100;
  const deltaLat = sisi / 111000;
  const deltaLng = sisi / (111000 * Math.cos((centerLat * Math.PI) / 180));
  return {
    type: "Polygon",
    coordinates: [[
      [centerLng - deltaLng, centerLat - deltaLat],
      [centerLng + deltaLng, centerLat - deltaLat],
      [centerLng + deltaLng, centerLat + deltaLat],
      [centerLng - deltaLng, centerLat + deltaLat],
      [centerLng - deltaLng, centerLat - deltaLat],
    ]],
  };
}

const penggarap = [];
const lahan = [];
const KOORDINAT_PUSAT = { lat: -7.5501, lng: 110.8267 };

PENGGARAP.forEach((p, idx) => {
  penggarap.push({
    id: p.id, nama: p.nama, alamat: p.alamat, usia: p.usia, kontak: p.kontak,
  });
  const lat = KOORDINAT_PUSAT.lat + rand(-0.005, 0.005);
  const lng = KOORDINAT_PUSAT.lng + rand(-0.005, 0.005);
  lahan.push({
    id: `l${idx + 1}`,
    penggarap_id: p.id,
    nama: `Sawah ${p.nama.replace("Pak ", "").replace("Bu ", "")}`,
    luas: p.luas,
    lokasi_koordinat: `${lat.toFixed(4)},${lng.toFixed(4)}`,
    polygon: genPolygon(lat, lng, p.luas),
  });
});

// =============================================================
// STEP 1: GENERATE PANEN
// =============================================================
const harvests = [];
let hId = 1;

const HASIL_DASAR = { padi: 6000, jagung: 5500, cabai: 8000 };

// ✅ Map musim: key = musimId, value = { penggarap_id, komoditas, tahun, panenList[] }
const musimMap = {};

function faktorVariasiCabai() {
  const r = Math.random();
  if (r < 0.15) return rand(0.35, 0.55);
  if (r < 0.45) return rand(0.55, 0.75);
  if (r < 0.85) return rand(0.75, 0.95);
  return rand(0.95, 1.30);
}

function generatePanenSingle(p, land, komoditas, tahun, bulanMulai, bulanAkhir) {
  const tglPanen = new Date(tahun, randInt(bulanMulai, bulanAkhir), randInt(1, 28));
  const hasil = Math.round(HASIL_DASAR[komoditas] * land.luas * p.kualitas * rand(0.92, 1.08));
  const harga = HARGA[komoditas][tahun] || HARGA[komoditas][2025];
  const biaya = biayaPanen(komoditas, tahun);
  const [po, pp] = p.skema;
  const profitBersih = hasil * harga - hasil * biaya;

  const musimId = `${p.id}-${tahun}-${komoditas}-${bulanMulai}`;
  musimMap[musimId] = {
    penggarap_id: p.id,
    komoditas,
    tahun,
    panenList: [],
  };

  const harvest = {
    id: `h${hId++}`,
    land_id: land.id,
    tanggal: dateStr(tglPanen),
    komoditas,
    musim: null,
    hasil_kg: hasil,
    harga_gabah: harga,
    harga_per_kg: harga,
    biaya_panen_per_kg: biaya,
    biaya_tambahan: 0,
    keterangan_biaya: null,
    bawa_penggarap: 0, bawa_owner: 0, bawa_lain: 0,
    persen_owner: po,
    persen_penggarap: pp,
    profit_bersih: profitBersih,
    profit_owner: profitBersih * (po / 100),
    profit_penggarap: profitBersih * (pp / 100),
    potongan_hutang: 0,
    potongan_hutang_log: [],
    total_hutang_sebelum: 0,
    sisa_hutang_sesudah: 0,
  };

  harvests.push(harvest);
  musimMap[musimId].panenList.push(harvest);
  return harvest;
}

function generatePanenCabai(p, land, tahun, bulanMulai, bulanAkhir) {
  const tglCabaiMulai = new Date(tahun, bulanMulai, randInt(1, 28));
  const faktor = faktorVariasiCabai();
  const totalHasilCabai = HASIL_DASAR.cabai * land.luas * p.kualitas * faktor;
  const perPanen = totalHasilCabai / 12;
  const hargaCabaiDasar = HARGA.cabai[tahun] || HARGA.cabai[2025];
  const biayaCabai = biayaPanen("cabai", tahun);
  const [po, pp] = p.skema;

  const musimCabaiId = `${p.id}-${tahun}-cabai-${bulanMulai}`;
  musimMap[musimCabaiId] = {
    penggarap_id: p.id,
    komoditas: "cabai",
    tahun,
    panenList: [],
  };

  const musimNama = `Musim Cabai ${tahun} (Apr-Sep)`;

  for (let i = 0; i < 12; i++) {
    const tglPanen = new Date(tglCabaiMulai);
    tglPanen.setDate(tglPanen.getDate() + i * 12);
    const hasil = Math.round(perPanen * rand(0.85, 1.15));
    const hargaCabai = Math.round(hargaCabaiDasar * rand(0.9, 1.1));
    const profitBersih = hasil * hargaCabai - hasil * biayaCabai;

    const harvest = {
      id: `h${hId++}`,
      land_id: land.id,
      tanggal: dateStr(tglPanen),
      komoditas: "cabai",
      musim: musimNama,
      hasil_kg: hasil,
      harga_gabah: hargaCabai,
      harga_per_kg: hargaCabai,
      biaya_panen_per_kg: biayaCabai,
      biaya_tambahan: 0,
      keterangan_biaya: null,
      bawa_penggarap: 0, bawa_owner: 0, bawa_lain: 0,
      persen_owner: po,
      persen_penggarap: pp,
      profit_bersih: profitBersih,
      profit_owner: profitBersih * (po / 100),
      profit_penggarap: profitBersih * (pp / 100),
      potongan_hutang: 0,
      potongan_hutang_log: [],
      total_hutang_sebelum: 0,
      sisa_hutang_sesudah: 0,
    };
    harvests.push(harvest);
    musimMap[musimCabaiId].panenList.push(harvest);
  }
}

PENGGARAP.forEach((p, pIdx) => {
  const land = lahan[pIdx];

  TAHUN_LIST.forEach((tahun) => {
    if (p.pola === "padi") {
      generatePanenSingle(p, land, "padi", tahun, 0, 3);
      generatePanenSingle(p, land, "padi", tahun, 6, 9);
    } else if (p.pola === "padi-jagung") {
      generatePanenSingle(p, land, "padi", tahun, 0, 3);
      generatePanenSingle(p, land, "jagung", tahun, 5, 8);
      generatePanenSingle(p, land, "padi", tahun, 10, 11);
    } else if (p.pola === "padi-cabai") {
      generatePanenCabai(p, land, tahun, 3, 8);
      generatePanenSingle(p, land, "padi", tahun, 9, 11);
    }
  });
});

harvests.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

// =============================================================
// STEP 2: HUTANG + POTONG (FIX: PASTI LUNAS di panen terakhir)
// =============================================================
const debts = [];
let dId = 1;

Object.entries(musimMap).forEach(([musimId, musim]) => {
  const p = PENGGARAP.find((pg) => pg.id === musim.penggarap_id);
  if (!p) return;
  const land = lahan.find((l) => l.penggarap_id === p.id);
  if (!land) return;
  if (musim.panenList.length === 0) return;

  const profitPenggarapMurni = musim.panenList.reduce(
    (s, h) => s + h.profit_penggarap,
    0
  );

  const bulanMusim = BULAN_MUSIM[musim.komoditas] || 4;
  const targetMinimumProfit = UMR_BULANAN * bulanMusim;

  const biayaPerHa = biayaModalPerHa(musim.komoditas, musim.tahun);
  let totalHutang = Math.round(biayaPerHa * land.luas * rand(0.95, 1.05));

  const maxHutang = profitPenggarapMurni - targetMinimumProfit;
  if (maxHutang < 0) {
    totalHutang = Math.max(0, Math.round(profitPenggarapMurni * 0.3));
  } else if (totalHutang > maxHutang) {
    totalHutang = Math.round(maxHutang);
  }

  if (totalHutang <= 0) return;

  const isMultiHutang = Math.random() < 0.2;
  const jmlHutang = isMultiHutang ? randInt(2, 3) : 1;

  const panenPertama = musim.panenList[0];
  const tglPanenPertama = new Date(panenPertama.tanggal);
  const tglHutangBase = new Date(tglPanenPertama);
  tglHutangBase.setDate(tglHutangBase.getDate() - randInt(7, 21));

  const keperluanList = {
    padi: ["Beli bibit & pupuk padi", "Sewa traktor & pengolahan lahan", "Beli pestisida & herbisida", "Biaya tanam & tenaga kerja"],
    jagung: ["Beli bibit & pupuk jagung", "Beli pestisida jagung", "Biaya tanam jagung"],
    cabai: ["Beli bibit & mulsa cabai", "Sewa lahan & pengolahan", "Beli pupuk & pestisida cabai", "Biaya tanam & tenaga kerja cabai", "Beli ajir & tali cabai"],
  };
  const list = keperluanList[musim.komoditas] || ["Modal produksi"];

  const hutangPerBagian = [];
  if (jmlHutang === 1) {
    hutangPerBagian.push(totalHutang);
  } else {
    let sisa = totalHutang;
    for (let i = 0; i < jmlHutang; i++) {
      if (i === jmlHutang - 1) {
        hutangPerBagian.push(sisa);
      } else {
        const bagian = Math.round((sisa / (jmlHutang - i)) * rand(0.8, 1.2));
        hutangPerBagian.push(bagian);
        sisa -= bagian;
      }
    }
  }

  const debtObjects = [];
  hutangPerBagian.forEach((jumlah, idx) => {
    if (jumlah <= 0) return;
    const tglHutang = new Date(tglHutangBase);
    tglHutang.setDate(tglHutang.getDate() + idx * randInt(3, 10));

    const debt = {
      id: `d${dId++}`,
      penggarap_id: p.id,
      tanggal: dateStr(tglHutang),
      jumlah,
      dibayar: 0,
      sisa: jumlah,
      keperluan: list[randInt(0, list.length - 1)],
      musim_ref: { musim_id: musimId, komoditas: musim.komoditas, tahun: musim.tahun },
      log_perubahan: [],
    };
    debts.push(debt);
    debtObjects.push(debt);
  });

  // ============================================================
  // ✅ POTONG HUTANG — PASTI LUNAS
  // ============================================================
  if (musim.komoditas === "cabai") {
    // Cabai: potong dibagi 12 panen, panen terakhir LUNAS
    const panenList = musim.panenList;
    const jumlahPanen = panenList.length;
    const totalHutangDebts = debtObjects.reduce((s, d) => s + d.jumlah, 0);
    const potonganPerPanen = Math.round(totalHutangDebts / jumlahPanen);

    // Buat "sisa" tracking dari semua debt
    let sisaHutangTotal = totalHutangDebts;

    panenList.forEach((panen, i) => {
      const isLast = i === jumlahPanen - 1;
      const potongTarget = isLast ? sisaHutangTotal : potonganPerPanen;
      if (potongTarget <= 0) return;

      const potonganLog = [];
      let sisaPotong = potongTarget;
      let potongAktual = 0;

      for (const debt of debtObjects) {
        if (sisaPotong <= 0) break;
        if (debt.sisa <= 0) continue;

        const bayar = Math.min(debt.sisa, sisaPotong);
        debt.sisa -= bayar;
        debt.dibayar += bayar;
        sisaPotong -= bayar;
        potongAktual += bayar;

        potonganLog.push({
          debt_id: debt.id,
          jumlah: bayar,
          tanggal_hutang: debt.tanggal,
          keperluan: debt.keperluan,
          sisa_sesudah: debt.sisa,
        });
      }

      sisaHutangTotal -= potongAktual;

      panen.potongan_hutang = potongAktual;
      panen.potongan_hutang_log = potonganLog;
      panen.total_hutang_sebelum = sisaHutangTotal + potongAktual;
      panen.sisa_hutang_sesudah = sisaHutangTotal;
      panen.profit_owner += potongAktual;
      panen.profit_penggarap -= potongAktual;
    });
  } else {
    // Padi/Jagung: LUNAS di panen itu
    const panenTarget = musim.panenList[0];
    let totalPotong = 0;
    const potonganLog = [];

    debtObjects.forEach((debt) => {
      if (debt.sisa <= 0) return;
      const bayar = debt.sisa;
      debt.sisa = 0;
      debt.dibayar = debt.jumlah;
      totalPotong += bayar;

      potonganLog.push({
        debt_id: debt.id,
        jumlah: bayar,
        tanggal_hutang: debt.tanggal,
        keperluan: debt.keperluan,
        sisa_sesudah: 0,
      });
    });

    panenTarget.potongan_hutang = totalPotong;
    panenTarget.potongan_hutang_log = potonganLog;
    panenTarget.total_hutang_sebelum = totalPotong;
    panenTarget.sisa_hutang_sesudah = 0;
    panenTarget.profit_owner += totalPotong;
    panenTarget.profit_penggarap -= totalPotong;
  }
});

// =============================================================
// GENERATE MUSIM CABAI
// =============================================================
const musim_cabai = [];
let mId = 1;

PENGGARAP.filter((p) => p.pola === "padi-cabai").forEach((p) => {
  TAHUN_LIST.forEach((tahun) => {
    const mulai = new Date(tahun, 3, 1);
    const selesai = new Date(tahun, 9, 30);
    musim_cabai.push({
      id: `m${mId++}`,
      nama: `Musim Cabai ${tahun} (Apr-Sep)`,
      tanggal_mulai: dateStr(mulai),
      tanggal_selesai: dateStr(selesai),
      catatan: null,
    });
  });
});

// =============================================================
// KATEGORI
// =============================================================
const categories = [
  { komoditas: "padi",         cukup: 5000,  baik: 6000,  sangat_baik: 7000 },
  { komoditas: "jagung",       cukup: 5000,  baik: 6500,  sangat_baik: 8000 },
  { komoditas: "cabai_rawit",  cukup: 4000,  baik: 6000,  sangat_baik: 8000 },
  { komoditas: "kacang_tanah", cukup: 1000,  baik: 1500,  sangat_baik: 2000 },
  { komoditas: "bawang_merah", cukup: 8000,  baik: 10000, sangat_baik: 12000 },
];

const output = {
  info: {
    nama: "Demo Harvestan 10 Tahun",
    deskripsi: "Data contoh petani sukses 2016-2025 dengan fluktuasi realistis",
    periode: `${TAHUN_MULAI}-${TAHUN_AKHIR}`,
    total_tahun: TAHUN_LIST.length,
  },
  penggarap, lahan, harvests, debts, musim_cabai, categories,
};

const outPath = path.join(process.cwd(), "public", "demo-data.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

// =============================================================
// LAPORAN
// =============================================================
const totalMusim = Object.keys(musimMap).length;
const panenDipotong = harvests.filter((h) => h.potongan_hutang > 0).length;
const totalPotongan = harvests.reduce((s, h) => s + (h.potongan_hutang || 0), 0);
const totalHutangAwal = debts.reduce((s, d) => s + d.jumlah, 0);
const totalHutangLunas = debts.filter((d) => d.sisa <= 0).length;
const hutangAktif = debts.filter((d) => d.sisa > 0);
const panenNegatif = harvests.filter((h) => h.profit_penggarap < 0);

const cabaiMusim = Object.entries(musimMap).filter(([, m]) => m.komoditas === "cabai");
const distKat = { kurang: 0, cukup: 0, baik: 0, sangat: 0 };
cabaiMusim.forEach(([, m]) => {
  const land = lahan.find((l) => l.penggarap_id === m.penggarap_id);
  if (!land) return;
  const totalHasil = m.panenList.reduce((s, h) => s + h.hasil_kg, 0);
  const prod = totalHasil / Number(land.luas);
  if (prod >= 8000) distKat.sangat++;
  else if (prod >= 6000) distKat.baik++;
  else if (prod >= 4000) distKat.cukup++;
  else distKat.kurang++;
});

const musimProfitCek = [];
Object.entries(musimMap).forEach(([musimId, musim]) => {
  const profitP = musim.panenList.reduce((s, h) => s + h.profit_penggarap, 0);
  const bulan = BULAN_MUSIM[musim.komoditas] || 4;
  const target = UMR_BULANAN * bulan;
  musimProfitCek.push({ musimId, profitP, target, isOK: profitP >= target });
});

const musimBelumOK = musimProfitCek.filter((m) => !m.isOK);

console.log("✅ Demo data berhasil di-generate!");
console.log("");
console.log(`📊 Statistik:`);
console.log(`   Penggarap:  ${penggarap.length}`);
console.log(`   Lahan:      ${lahan.length} (total ${lahan.reduce((s, l) => s + l.luas, 0).toFixed(1)} ha)`);
console.log(`   Panen:      ${harvests.length}`);
console.log(`   Hutang:     ${debts.length}`);
console.log(`   Total musim: ${totalMusim}`);
console.log(`   Kategori:   ${categories.length}`);
console.log("");
console.log(`💰 Hutang:`);
console.log(`   Total hutang awal: Rp ${totalHutangAwal.toLocaleString("id-ID")}`);
console.log(`   ✅ Hutang LUNAS:   ${totalHutangLunas} dari ${debts.length}`);
console.log(`   ❌ Hutang AKTIF:   ${hutangAktif.length}`);
if (hutangAktif.length > 0) {
  console.log(`      Total sisa aktif: Rp ${hutangAktif.reduce((s, d) => s + d.sisa, 0).toLocaleString("id-ID")}`);
}
console.log("");
console.log(`💸 Potong Hutang:`);
console.log(`   Panen dipotong: ${panenDipotong}`);
console.log(`   Total potongan: Rp ${totalPotongan.toLocaleString("id-ID")}`);
console.log("");
console.log(`✅ Cek Profit Penggarap:`);
console.log(`   Panen NEGATIF: ${panenNegatif.length}`);
console.log(`   Musim belum ≥ UMR: ${musimBelumOK.length}`);
console.log("");
console.log(`🌶️ Distribusi Kategori Cabai (${cabaiMusim.length} musim):`);
console.log(`   ⚠️ KURANG:      ${distKat.kurang} (${((distKat.kurang/cabaiMusim.length)*100).toFixed(0)}%)`);
console.log(`   ⭐ CUKUP:       ${distKat.cukup} (${((distKat.cukup/cabaiMusim.length)*100).toFixed(0)}%)`);
console.log(`   ⭐⭐ BAIK:      ${distKat.baik} (${((distKat.baik/cabaiMusim.length)*100).toFixed(0)}%)`);
console.log(`   ⭐⭐⭐ SANGAT:  ${distKat.sangat} (${((distKat.sangat/cabaiMusim.length)*100).toFixed(0)}%)`);
console.log("");
console.log(`🎉 Selesai! File: ${outPath}`);
