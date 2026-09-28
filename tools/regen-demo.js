// =============================================================
// REGEN DEMO DATA — Harvestan v2.0
// Jalankan: node tools/regen-demo.js
// Output: public/demo-data.json (overwrite)
// =============================================================

const fs = require("fs");
const path = require("path");

// =============================================================
// KONFIGURASI
// =============================================================
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

const BIAYA_PANEN = {
  padi:   { 2016: 450, 2025: 650 },
  jagung: { 2016: 380, 2025: 550 },
  cabai:  { 2016: 1200, 2025: 1800 },
};

function biayaPanen(komoditas, tahun) {
  const r = BIAYA_PANEN[komoditas];
  const rasio = (tahun - 2016) / (2025 - 2016);
  return Math.round(r[2016] + (r[2025] - r[2016]) * rasio);
}

// =============================================================
// 13 PENGGARAP (total 17 ha)
// =============================================================
const PENGGARAP = [
  { id: "p1",  nama: "Pak Slamet",  alamat: "Dusun Sumberjo",  usia: 58, kontak: "081234567890", luas: 2.0, pola: "padi-jagung", skema: [50, 50], kualitas: 1.15 },
  { id: "p2",  nama: "Pak Budi",    alamat: "Dusun Sumberjo",  usia: 45, kontak: "081234567891", luas: 1.5, pola: "padi",        skema: [50, 50], kualitas: 1.00 },
  { id: "p3",  nama: "Bu Siti",     alamat: "Dusun Ngudi",     usia: 42, kontak: "081234567892", luas: 1.5, pola: "padi-cabai",  skema: [40, 60], kualitas: 1.20 },
  { id: "p4",  nama: "Pak Tarno",   alamat: "Dusun Ngudi",     usia: 50, kontak: "081234567893", luas: 1.0, pola: "padi",        skema: [50, 50], kualitas: 0.85 },
  { id: "p5",  nama: "Pak Yanto",   alamat: "Dusun Sumberjo",  usia: 47, kontak: "081234567894", luas: 1.5, pola: "padi-jagung", skema: [60, 40], kualitas: 1.05 },
  { id: "p6",  nama: "Bu Dewi",     alamat: "Dusun Ngudi",     usia: 38, kontak: "081234567895", luas: 0.8, pola: "padi",        skema: [50, 50], kualitas: 0.75 },
  { id: "p7",  nama: "Pak Hasan",   alamat: "Dusun Sumberjo",  usia: 55, kontak: "081234567896", luas: 1.5, pola: "padi",        skema: [50, 50], kualitas: 1.00 },
  { id: "p8",  nama: "Pak Rahmat",  alamat: "Dusun Ngudi",     usia: 44, kontak: "081234567897", luas: 2.0, pola: "padi-cabai",  skema: [40, 60], kualitas: 1.18 },
  { id: "p9",  nama: "Pak Wawan",   alamat: "Dusun Sumberjo",  usia: 41, kontak: "081234567898", luas: 1.2, pola: "padi-jagung", skema: [60, 40], kualitas: 1.02 },
  { id: "p10", nama: "Bu Rina",     alamat: "Dusun Ngudi",     usia: 36, kontak: "081234567899", luas: 1.0, pola: "padi-jagung", skema: [50, 50], kualitas: 0.90 },
  { id: "p11", nama: "Pak Joko",    alamat: "Dusun Sumberjo",  usia: 52, kontak: "081234567800", luas: 1.3, pola: "padi",        skema: [70, 30], kualitas: 1.00 },
  { id: "p12", nama: "Pak Anto",    alamat: "Dusun Ngudi",     usia: 33, kontak: "081234567801", luas: 0.7, pola: "padi-jagung", skema: [50, 50], kualitas: 0.78 },
  { id: "p13", nama: "Bu Lastri",   alamat: "Dusun Sumberjo",  usia: 40, kontak: "081234567802", luas: 1.0, pola: "padi-cabai",  skema: [60, 40], kualitas: 1.16 },
];

// =============================================================
// HELPER
// =============================================================
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

// =============================================================
// GENERATE PENGGARAP & LAHAN
// =============================================================
const penggarap = [];
const lahan = [];

const KOORDINAT_PUSAT = { lat: -7.5501, lng: 110.8267 };

PENGGARAP.forEach((p, idx) => {
  penggarap.push({
    id: p.id,
    nama: p.nama,
    alamat: p.alamat,
    usia: p.usia,
    kontak: p.kontak,
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
// GENERATE HUTANG (sebelum panen, biar bisa dipotong)
// =============================================================
const debts = [];
let dId = 1;

// Hutang untuk penggarap yang butuh modal
const PENGGARAP_HUTANG = ["p2", "p4", "p6", "p10", "p12"];

// Simpan hutang per penggarap (untuk dipotong panen)
const hutangPerPenggarap = {};

PENGGARAP_HUTANG.forEach((pid) => {
  hutangPerPenggarap[pid] = [];
  const jumlahHutang = randInt(4, 6);

  for (let i = 0; i < jumlahHutang; i++) {
    const tahun = 2016 + Math.floor((i / jumlahHutang) * 8); // 2016-2023
    const bulan = randInt(0, 11);
    const tanggal = new Date(tahun, bulan, randInt(1, 28));

    const jumlah = randInt(15, 40) * 100000; // 1.5-4 juta

    const keperluanList = [
      "Beli pestisida",
      "Beli pupuk",
      "Sewa traktor",
      "Beli bibit",
      "Biaya tenaga kerja",
      "Beli obat hama",
      "Perbaikan irigasi",
    ];

    const debt = {
      id: `d${dId++}`,
      penggarap_id: pid,
      tanggal: dateStr(tanggal),
      jumlah,
      dibayar: 0,
      sisa: jumlah,
      keperluan: keperluanList[randInt(0, keperluanList.length - 1)],
      log_perubahan: [],
    };

    debts.push(debt);
    hutangPerPenggarap[pid].push(debt);
  }

  // Urutkan hutang per penggarap berdasarkan tanggal
  hutangPerPenggarap[pid].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );
});

// =============================================================
// GENERATE PANEN
// =============================================================
const harvests = [];
let hId = 1;

const HASIL_DASAR = {
  padi: 6000,
  jagung: 5500,
  cabai: 8000,
};

// Fungsi cari hutang yang bisa dipotong (sisa > 0, tanggal <= panen)
function cariHutangAktif(penggarapId, tanggalPanen) {
  const list = hutangPerPenggarap[penggarapId];
  if (!list) return [];

  const tglPanen = new Date(tanggalPanen).getTime();
  return list
    .filter((h) => h.sisa > 0 && new Date(h.tanggal).getTime() <= tglPanen)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
}

PENGGARAP.forEach((p, pIdx) => {
  const land = lahan[pIdx];

  TAHUN_LIST.forEach((tahun) => {
    let musimTanam = [];

    if (p.pola === "padi") {
      const bulanTanam = randInt(10, 12) === 12 ? 1 : 11;
      musimTanam.push({
        komoditas: "padi",
        tanggalTanam: new Date(tahun - 1, bulanTanam - 1, randInt(1, 28)),
      });
    } else if (p.pola === "padi-jagung") {
      musimTanam.push({
        komoditas: "padi",
        tanggalTanam: new Date(tahun - 1, 9, randInt(1, 28)),
      });
      musimTanam.push({
        komoditas: "jagung",
        tanggalTanam: new Date(tahun, 3, randInt(1, 28)),
      });
    } else if (p.pola === "padi-cabai") {
      musimTanam.push({
        komoditas: "padi",
        tanggalTanam: new Date(tahun - 1, 9, randInt(1, 28)),
      });
      musimTanam.push({
        komoditas: "cabai",
        tanggalTanam: new Date(tahun, 3, randInt(1, 28)),
      });
    }

    musimTanam.forEach((mt) => {
      const komoditas = mt.komoditas;
      const tanggalPanen = new Date(mt.tanggalTanam);
      tanggalPanen.setDate(tanggalPanen.getDate() + UMUR[komoditas]);

      const tahunPanen = tanggalPanen.getFullYear();
      const harga = HARGA[komoditas][tahunPanen] || HARGA[komoditas][2025];
      const biayaPerKg = biayaPanen(komoditas, tahunPanen);

      if (komoditas === "cabai") {
        const totalHasil = HASIL_DASAR.cabai * land.luas * p.kualitas;
        const perPanen = totalHasil / 12;

        for (let i = 0; i < 12; i++) {
          const tgl = new Date(tanggalPanen);
          tgl.setDate(tgl.getDate() + i * 12);

          const hasil = Math.round(perPanen * rand(0.85, 1.15));
          const hargaCabai = harga * rand(0.9, 1.1);
          const [po, pp] = p.skema;

          const pendapatan = hasil * Math.round(hargaCabai);
          const biaya = hasil * biayaPerKg;
          const profitBersih = pendapatan - biaya;

          const profitPenggarapAwal = profitBersih * (pp / 100);
          let profitOwner = profitBersih * (po / 100);
          let profitPenggarap = profitPenggarapAwal;

          // Coba potong hutang (hanya kalau penggarap punya hutang)
          let potonganHutang = 0;
          const potonganLog = [];
          const hutangAktif = cariHutangAktif(p.id, dateStr(tgl));

          if (hutangAktif.length > 0 && profitPenggarap > 0) {
            // Potong max 30% dari profit penggarap biar tetap realistis
            const maxPotong = Math.min(profitPenggarap * 0.3, hutangAktif.reduce((s, h) => s + h.sisa, 0));
            let sisaPotong = Math.round(maxPotong);

            for (const h of hutangAktif) {
              if (sisaPotong <= 0) break;
              const bayar = Math.min(h.sisa, sisaPotong);
              h.sisa -= bayar;
              h.dibayar += bayar;
              sisaPotong -= bayar;
              potonganHutang += bayar;

              potonganLog.push({
                debt_id: h.id,
                jumlah: bayar,
                tanggal_hutang: h.tanggal,
                keperluan: h.keperluan,
                sisa_sesudah: h.sisa,
              });
            }

            profitPenggarap -= potonganHutang;
            profitOwner += potonganHutang;
          }

          harvests.push({
            id: `h${hId++}`,
            land_id: land.id,
            tanggal: dateStr(tgl),
            komoditas: "cabai",
            musim: `Musim Cabai ${tahunPanen}`,
            hasil_kg: hasil,
            harga_gabah: Math.round(hargaCabai),
            harga_per_kg: Math.round(hargaCabai),
            biaya_panen_per_kg: biayaPerKg,
            biaya_tambahan: 0,
            keterangan_biaya: null,
            bawa_penggarap: 0,
            bawa_owner: 0,
            bawa_lain: 0,
            persen_owner: po,
            persen_penggarap: pp,
            profit_bersih: profitBersih,
            profit_owner: profitOwner,
            profit_penggarap: profitPenggarap,
            potongan_hutang: potonganHutang,
            potongan_hutang_log: potonganLog,
            total_hutang_sebelum: potonganHutang > 0 ? potonganHutang + hutangAktif.reduce((s, h) => s + h.sisa, 0) : 0,
            sisa_hutang_sesudah: hutangAktif.reduce((s, h) => s + h.sisa, 0),
          });
        }
      } else {
        const hasil = Math.round(
          HASIL_DASAR[komoditas] * land.luas * p.kualitas * rand(0.92, 1.08)
        );
        const [po, pp] = p.skema;

        const pendapatan = hasil * harga;
        const biaya = hasil * biayaPerKg;
        const profitBersih = pendapatan - biaya;

        let profitOwner = profitBersih * (po / 100);
        let profitPenggarap = profitBersih * (pp / 100);

        // Coba potong hutang
        let potonganHutang = 0;
        const potonganLog = [];
        const hutangAktif = cariHutangAktif(p.id, dateStr(tanggalPanen));

        if (hutangAktif.length > 0 && profitPenggarap > 0) {
          const maxPotong = Math.min(profitPenggarap * 0.5, hutangAktif.reduce((s, h) => s + h.sisa, 0));
          let sisaPotong = Math.round(maxPotong);

          for (const h of hutangAktif) {
            if (sisaPotong <= 0) break;
            const bayar = Math.min(h.sisa, sisaPotong);
            h.sisa -= bayar;
            h.dibayar += bayar;
            sisaPotong -= bayar;
            potonganHutang += bayar;

            potonganLog.push({
              debt_id: h.id,
              jumlah: bayar,
              tanggal_hutang: h.tanggal,
              keperluan: h.keperluan,
              sisa_sesudah: h.sisa,
            });
          }

          profitPenggarap -= potonganHutang;
          profitOwner += potonganHutang;
        }

        harvests.push({
          id: `h${hId++}`,
          land_id: land.id,
          tanggal: dateStr(tanggalPanen),
          komoditas,
          musim: null,
          hasil_kg: hasil,
          harga_gabah: harga,
          harga_per_kg: harga,
          biaya_panen_per_kg: biayaPerKg,
          biaya_tambahan: 0,
          keterangan_biaya: null,
          bawa_penggarap: 0,
          bawa_owner: 0,
          bawa_lain: 0,
          persen_owner: po,
          persen_penggarap: pp,
          profit_bersih: profitBersih,
          profit_owner: profitOwner,
          profit_penggarap: profitPenggarap,
          potongan_hutang: potonganHutang,
          potongan_hutang_log: potonganLog,
          total_hutang_sebelum: potonganHutang > 0 ? potonganHutang + hutangAktif.reduce((s, h) => s + h.sisa, 0) : 0,
          sisa_hutang_sesudah: hutangAktif.reduce((s, h) => s + h.sisa, 0),
        });
      }
    });
  });
});

harvests.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

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
      nama: `Musim Cabai ${tahun}`,
      tanggal_mulai: dateStr(mulai),
      tanggal_selesai: dateStr(selesai),
      catatan: null,
    });
  });
});

// =============================================================
// GENERATE KATEGORI
// =============================================================
const categories = [
  { komoditas: "padi",   cukup: 5000, baik: 6000, sangat_baik: 7000 },
  { komoditas: "jagung", cukup: 4500, baik: 5500, sangat_baik: 6500 },
  { komoditas: "cabai",  cukup: 6000, baik: 8000, sangat_baik: 10000 },
];

// =============================================================
// SUSUN OUTPUT
// =============================================================
const output = {
  info: {
    nama: "Demo Harvestan 10 Tahun",
    deskripsi: "Data contoh petani sukses 2016-2025 dengan fluktuasi realistis",
    periode: `${TAHUN_MULAI}-${TAHUN_AKHIR}`,
    total_tahun: TAHUN_LIST.length,
  },
  penggarap,
  lahan,
  harvests,
  debts,
  musim_cabai,
  categories,
};

// =============================================================
// TULIS FILE
// =============================================================
const outPath = path.join(process.cwd(), "public", "demo-data.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

// =============================================================
// LAPORAN
// =============================================================
const panenDipotong = harvests.filter((h) => h.potongan_hutang > 0).length;
const totalPotongan = harvests.reduce((s, h) => s + (h.potongan_hutang || 0), 0);

console.log("✅ Demo data berhasil di-generate!");
console.log("");
console.log(`📊 Statistik:`);
console.log(`   Penggarap:  ${penggarap.length}`);
console.log(`   Lahan:      ${lahan.length} (total ${lahan.reduce((s, l) => s + l.luas, 0).toFixed(1)} ha)`);
console.log(`   Panen:      ${harvests.length}`);
console.log(`   Hutang:     ${debts.length}`);
console.log(`   Musim:      ${musim_cabai.length}`);
console.log(`   Kategori:   ${categories.length}`);
console.log("");
console.log(`💸 Potong Hutang:`);
console.log(`   Panen dengan potongan: ${panenDipotong}`);
console.log(`   Total potongan: Rp ${totalPotongan.toLocaleString("id-ID")}`);
console.log("");
console.log(`📁 File: ${outPath}`);
console.log("");
console.log(`🎯 Distribusi Pola:`);
console.log(`   Monokultur padi:    ${PENGGARAP.filter(p => p.pola === "padi").length}`);
console.log(`   Rotasi padi-jagung: ${PENGGARAP.filter(p => p.pola === "padi-jagung").length}`);
console.log(`   Rotasi padi-cabai:  ${PENGGARAP.filter(p => p.pola === "padi-cabai").length}`);
console.log("");
console.log(`🎯 Distribusi Bagi Hasil:`);
console.log(`   50:50: ${PENGGARAP.filter(p => p.skema[0] === 50).length}`);
console.log(`   60:40: ${PENGGARAP.filter(p => p.skema[0] === 60).length}`);
console.log(`   70:30: ${PENGGARAP.filter(p => p.skema[0] === 70).length}`);
console.log(`   40:60: ${PENGGARAP.filter(p => p.skema[0] === 40).length}`);
console.log("");
console.log(`🎉 Selesai!`);
