"use client";

import { useState, useMemo, useEffect } from "react";

type Land = {
  id: string;
  nama: string;
  luas: number;
};

type Pupuk = {
  id: string;
  nama: string;
  merk: string | null;
  jenis: string;
  n_persen: number;
  p_persen: number;
  k_persen: number;
  unsur_lain: string | null;
  kemasan_kg: number;
  is_active: boolean;
  urutan: number;
};

type Props = {
  lands: Land[];
  pupuks: Pupuk[];
};

type BarisPupuk = {
  id: string;
  pupukId: string;
  pupukDasar: boolean;
};

type HasilItem = {
  nama: string;
  kg: number;
  n: number;
  p: number;
  k: number;
  unsurLain: string | null;
  isDasar: boolean;
  isNonNPK: boolean;
  dikurangi: boolean;
};

type HasilFase = {
  fase: string;
  waktu: string;
  pupukCampur: { nama: string; kg: number }[];
  pupukDasar: { nama: string; kg: number }[];
  totalCampur: number;
  mix: {
    totalBagian: number;
    urutan: { nama: string; kg: number }[];
    langkah: { langkah: string; detail: string }[];
  } | null;
};

type FaseCustom = {
  id: string;
  nama: string;
  hst: string;
  persen: number;
};

type StatusHara = "rendah" | "sedang" | "tinggi" | "tidak_diketahui";

const KONFIG_FASE: Record<
  string,
  {
    default: { fase: string; waktu: string }[];
    max: number;
    min: number;
  }
> = {
  padi: {
    default: [
      { fase: "Fase 1", waktu: "0-14 HST" },
      { fase: "Fase 2", waktu: "21-28 HST" },
      { fase: "Fase 3", waktu: "35-42 HST" },
    ],
    min: 2,
    max: 4,
  },
  jagung: {
    default: [
      { fase: "Fase 1", waktu: "0-10 HST" },
      { fase: "Fase 2", waktu: "28-30 HST" },
      { fase: "Fase 3", waktu: "45-50 HST" },
    ],
    min: 2,
    max: 4,
  },
  cabai: {
    default: [
      { fase: "Fase 1", waktu: "0 HST" },
      { fase: "Fase 2", waktu: "20-30 HST" },
      { fase: "Fase 3", waktu: "45-60 HST" },
      { fase: "Fase 4", waktu: "75-90 HST" },
    ],
    min: 3,
    max: 6,
  },
  bawang_merah: {
    default: [
      { fase: "Fase 1", waktu: "0-2 hari sebelum tanam" },
      { fase: "Fase 2", waktu: "10-15 HST" },
      { fase: "Fase 3", waktu: "20-25 HST" },
    ],
    min: 2,
    max: 4,
  },
};

const KEBUTUHAN_HARA: Record<
  string,
  {
    n: number;
    p: number;
    k: number;
    benih_min: number;
    benih_max: number;
    satuan_benih: string;
  }
> = {
  padi: {
    n: 120,
    p: 60,
    k: 60,
    benih_min: 25,
    benih_max: 40,
    satuan_benih: "kg",
  },
  jagung: {
    n: 150,
    p: 75,
    k: 75,
    benih_min: 20,
    benih_max: 25,
    satuan_benih: "kg",
  },
  cabai: {
    n: 150,
    p: 100,
    k: 100,
    benih_min: 0.5,
    benih_max: 1,
    satuan_benih: "kg",
  },
  bawang_merah: {
    n: 120,
    p: 90,
    k: 75,
    benih_min: 800,
    benih_max: 1200,
    satuan_benih: "kg umbi",
  },
};

const DOSIS_DEFAULT: Record<
  string,
  { dolomit: number; organik: number }
> = {
  padi: { dolomit: 1000, organik: 2000 },
  jagung: { dolomit: 500, organik: 2000 },
  cabai: { dolomit: 1500, organik: 2000 },
  bawang_merah: { dolomit: 1500, organik: 2000 },
};

function hitungDolomitDariPH(ph: number, luasHa: number): number {
  if (ph >= 6) return 0.75 * luasHa * 1000;

  const tabel = [
    { ph: 4.0, dosis: 10.0 },
    { ph: 4.5, dosis: 7.8 },
    { ph: 5.0, dosis: 5.5 },
    { ph: 5.5, dosis: 3.1 },
    { ph: 6.0, dosis: 0.75 },
  ];

  for (let i = 0; i < tabel.length - 1; i++) {
    const a = tabel[i];
    const b = tabel[i + 1];
    if (ph >= a.ph && ph <= b.ph) {
      const ratio = (ph - a.ph) / (b.ph - a.ph);
      const dosis = a.dosis + ratio * (b.dosis - a.dosis);
      return dosis * luasHa * 1000;
    }
  }

  return 0.75 * luasHa * 1000;
}

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  cabai: "🌶️ Cabai",
  bawang_merah: "🧅 Bawang Merah",
};

function isPupukAutoDasar(p: Pupuk): boolean {
  const namaLower = p.nama.toLowerCase();
  return (
    namaLower.includes("dolomit") ||
    namaLower.includes("kapur") ||
    namaLower.includes("kalsit") ||
    namaLower.includes("kandang") ||
    namaLower.includes("kompos") ||
    namaLower.includes("petroganik") ||
    p.jenis === "organik"
  );
}

function isPupukP(p: Pupuk): boolean {
  return p.n_persen === 0 && p.k_persen === 0 && p.p_persen > 0;
}

function isDolomit(p: Pupuk): boolean {
  const namaLower = p.nama.toLowerCase();
  return (
    namaLower.includes("dolomit") ||
    namaLower.includes("kapur") ||
    namaLower.includes("kalsit")
  );
}

function isOrganik(p: Pupuk): boolean {
  if (p.jenis === "organik") return true;
  const namaLower = p.nama.toLowerCase();
  return (
    namaLower.includes("kandang") ||
    namaLower.includes("kompos") ||
    namaLower.includes("petroganik")
  );
}

function isPupukKimia(p: Pupuk): boolean {
  return p.n_persen > 0 || p.p_persen > 0 || p.k_persen > 0;
}

// ===================== STATUS HARA TANAH =====================
// Sumber: Puslittanak / Balitbangtan (Buku Petunjuk Pengambilan Contoh Tanah)
function statusNTotal(n: number): StatusHara {
  if (n < 0.2) return "rendah";
  if (n <= 0.5) return "sedang";
  return "tinggi";
}

function statusPTersedia(p: number): StatusHara {
  // Metode Bray-1 / Olsen (ppm P2O5)
  if (p < 10) return "rendah";
  if (p <= 20) return "sedang";
  return "tinggi";
}

function statusKTersedia(k: number): StatusHara {
  // ppm K2O
  if (k < 20) return "rendah";
  if (k <= 40) return "sedang";
  return "tinggi";
}

function statusCOrganik(c: number): StatusHara {
  if (c < 2) return "rendah";
  if (c <= 3) return "sedang";
  return "tinggi";
}

function statusPH(ph: number): "asam" | "netral" | "basa" {
  if (ph < 5.5) return "asam";
  if (ph <= 7.5) return "netral";
  return "basa";
}

const STATUS_LABEL: Record<StatusHara, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  tidak_diketahui: "-",
};

const STATUS_COLOR: Record<StatusHara, string> = {
  rendah: "bg-red-100 text-red-800 border-red-300",
  sedang: "bg-amber-100 text-amber-800 border-amber-300",
  tinggi: "bg-green-100 text-green-800 border-green-300",
  tidak_diketahui: "bg-gray-100 text-gray-500 border-gray-300",
};

// Faktor koreksi dosis berdasarkan status hara
function faktorKoreksi(status: StatusHara): number {
  if (status === "rendah") return 1.25; // +25%
  if (status === "tinggi") return 0.75; // -25%
  return 1.0;
}

function hitungJumlahBagian(total: number): number {
  if (total > 1000) return 5;
  if (total > 500) return 3;
  if (total > 200) return 2;
  return 1;
}

function generateLangkahMix(
  pupukList: { nama: string; kg: number }[],
  jumlahBagian: number
): { langkah: string; detail: string }[] {
  if (pupukList.length === 0) return [];

  const sorted = [...pupukList].sort((a, b) => a.kg - b.kg);
  const langkah: { langkah: string; detail: string }[] = [];

  if (jumlahBagian === 1) {
    langkah.push({
      langkah: "Campur langsung",
      detail: `Campur semua pupuk (${sorted
        .map((p) => `${p.nama} ${p.kg.toFixed(1)} kg`)
        .join(" + ")}) di terpal bersih. Aduk 3-4x sampai warna rata.`,
    });
    langkah.push({
      langkah: "Aplikasi",
      detail:
        "Tabur merata ke seluruh lahan. Jangan menumpuk di 1 titik.",
    });
    return langkah;
  }

  const basis = sorted[sorted.length - 1];
  const bagianBasis = basis.kg / jumlahBagian;

  langkah.push({
    langkah: "1. Bagi pupuk terbanyak",
    detail: `Bagi ${basis.nama} (${basis.kg.toFixed(
      1
    )} kg) jadi ${jumlahBagian} tumpukan — masing-masing ± ${bagianBasis.toFixed(
      1
    )} kg.`,
  });

  let stepNum = 2;
  for (let i = 0; i < sorted.length - 1; i++) {
    const p = sorted[i];
    const perBagian = p.kg / jumlahBagian;
    langkah.push({
      langkah: `${stepNum}. Campur ${p.nama}`,
      detail: `Ambil ${p.nama} ± ${perBagian.toFixed(
        1
      )} kg, campur ke tiap tumpukan ${basis.nama}, aduk rata (${jumlahBagian}x).`,
    });
    stepNum++;
  }

  langkah.push({
    langkah: `${stepNum}. Gabung`,
    detail: `Gabung semua ${jumlahBagian} tumpukan jadi 1, aduk sekali lagi sampai warna rata.`,
  });

  langkah.push({
    langkah: `${stepNum + 1}. Aplikasi`,
    detail: `Tabur merata ke seluruh lahan. Total campuran: ${pupukList
      .reduce((s, p) => s + p.kg, 0)
      .toFixed(1)} kg.`,
  });

  return langkah;
}

export function KalkulatorKlien({ lands, pupuks }: Props) {
  const [modeTanam, setModeTanam] = useState<"standar" | "presisi">("standar");
  const [mode, setMode] = useState<"lahan" | "manual">("lahan");
  const [landId, setLandId] = useState("");
  const [luasManual, setLuasManual] = useState("");
  const [komoditas, setKomoditas] = useState("padi");
  const [modeJadwal, setModeJadwal] = useState<"split" | "sekali" | "custom">(
    "split"
  );
  const [phTanah, setPhTanah] = useState("");
  const [aktifkanKurangi, setAktifkanKurangi] = useState(false);
  const [persenKurangi, setPersenKurangi] = useState<25 | 50>(25);
  const [faseCustom, setFaseCustom] = useState<FaseCustom[]>([]);
  const [baris, setBaris] = useState<BarisPupuk[]>([
    { id: "b1", pupukId: "", pupukDasar: false },
  ]);

  // Input presisi
  const [nTotal, setNTotal] = useState("");
  const [pTersedia, setPTersedia] = useState("");
  const [kTersedia, setKTersedia] = useState("");
  const [cOrganik, setCOrganik] = useState("");
  const [phPresisi, setPhPresisi] = useState("");

  const [hasil, setHasil] = useState<null | {
    kebutuhan: HasilItem[];
    totalKg: number;
    benih: { min: number; max: number; satuan: string };
    warning: string[];
    jadwal: HasilFase[];
    modeJadwal: "split" | "sekali" | "custom";
    kurangiAktif: boolean;
    persenKurangi: number;
    statusPresisi: {
      n: StatusHara;
      p: StatusHara;
      k: StatusHara;
      c: StatusHara;
      ph: "asam" | "netral" | "basa" | "-";
    } | null;
  }>(null);

  useEffect(() => {
    if (modeJadwal === "custom") {
      const konfig = KONFIG_FASE[komoditas] || KONFIG_FASE.padi;
      if (faseCustom.length === 0) {
        const defaultFase: FaseCustom[] = konfig.default.map((f, i) => ({
          id: "fc" + i,
          nama: f.fase,
          hst: f.waktu,
          persen: Math.round(100 / konfig.default.length),
        }));
        const totalPersen = defaultFase.reduce((s, f) => s + f.persen, 0);
        defaultFase[0].persen += 100 - totalPersen;
        setFaseCustom(defaultFase);
      }
    }
  }, [modeJadwal, komoditas]);

  const luasHa = useMemo(() => {
    if (mode === "lahan") {
      const l = lands.find((x) => x.id === landId);
      return l?.luas || 0;
    }
    return parseFloat(luasManual) || 0;
  }, [mode, landId, luasManual, lands]);

  const konfigFase = KONFIG_FASE[komoditas] || KONFIG_FASE.padi;

  const adaOrganik = useMemo(() => {
    return baris.some((b) => {
      const p = pupuks.find((x) => x.id === b.pupukId);
      return p ? isOrganik(p) : false;
    });
  }, [baris, pupuks]);

  function tambahBaris() {
    setBaris((prev) => [
      ...prev,
      { id: "b" + Date.now() + Math.random(), pupukId: "", pupukDasar: false },
    ]);
  }

  function hapusBaris(id: string) {
    setBaris((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBaris(id: string, pupukId: string) {
    setBaris((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const pupuk = pupuks.find((p) => p.id === pupukId);
        const autoDasar = pupuk ? isPupukAutoDasar(pupuk) : false;
        return {
          ...b,
          pupukId,
          pupukDasar: autoDasar ? true : b.pupukDasar,
        };
      })
    );
  }

  function togglePupukDasar(id: string) {
    setBaris((prev) =>
      prev.map((b) => (b.id === id ? { ...b, pupukDasar: !b.pupukDasar } : b))
    );
  }

  function resetFaseCustom() {
    const konfig = KONFIG_FASE[komoditas] || KONFIG_FASE.padi;
    const defaultFase: FaseCustom[] = konfig.default.map((f, i) => ({
      id: "fc" + i + Date.now(),
      nama: f.fase,
      hst: f.waktu,
      persen: Math.round(100 / konfig.default.length),
    }));
    const totalPersen = defaultFase.reduce((s, f) => s + f.persen, 0);
    defaultFase[0].persen += 100 - totalPersen;
    setFaseCustom(defaultFase);
  }

  function tambahFase() {
    if (faseCustom.length >= konfigFase.max) return;
    const n = faseCustom.length;
    const baru: FaseCustom[] = [
      ...faseCustom,
      {
        id: "fc" + n + Date.now(),
        nama: `Fase ${n + 1}`,
        hst: "HST",
        persen: 0,
      },
    ];
    const rata = Math.round(100 / baru.length);
    baru.forEach((f) => {
      f.persen = rata;
    });
    const total = baru.reduce((s, f) => s + f.persen, 0);
    baru[0].persen += 100 - total;
    setFaseCustom(baru);
  }

  function hapusFase(id: string) {
    if (faseCustom.length <= konfigFase.min) return;
    const baru = faseCustom.filter((f) => f.id !== id);
    baru.forEach((f, i) => {
      f.nama = `Fase ${i + 1}`;
    });
    const rata = Math.round(100 / baru.length);
    baru.forEach((f) => {
      f.persen = rata;
    });
    const total = baru.reduce((s, f) => s + f.persen, 0);
    baru[0].persen += 100 - total;
    setFaseCustom(baru);
  }

  function updateFase(id: string, field: keyof FaseCustom, value: any) {
    setFaseCustom((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }

  function ratakanFase() {
    if (faseCustom.length === 0) return;
    const rata = Math.round(100 / faseCustom.length);
    const baru = faseCustom.map((f) => ({ ...f, persen: rata }));
    const total = baru.reduce((s, f) => s + f.persen, 0);
    baru[0].persen += 100 - total;
    setFaseCustom(baru);
  }

  const totalPersenCustom = faseCustom.reduce((s, f) => s + f.persen, 0);

  function hitung() {
    setHasil(null);

    if (luasHa <= 0) {
      alert("❌ Luas lahan belum diisi / tidak valid");
      return;
    }

    const kebutuhan = KEBUTUHAN_HARA[komoditas];
    if (!kebutuhan) {
      alert("❌ Komoditas tidak dikenal");
      return;
    }

    if (modeJadwal === "custom") {
      if (faseCustom.length === 0) {
        alert("❌ Fase custom belum diatur");
        return;
      }
      if (totalPersenCustom !== 100) {
        alert(
          `❌ Total persen fase harus 100%. Sekarang: ${totalPersenCustom}%`
        );
        return;
      }
    }

    const pupukDenganFlag = baris
      .filter((b) => b.pupukId)
      .map((b) => {
        const p = pupuks.find((x) => x.id === b.pupukId);
        return p ? { pupuk: p, pupukDasar: b.pupukDasar } : null;
      })
      .filter(
        (x): x is { pupuk: Pupuk; pupukDasar: boolean } => x !== null
      );

    if (pupukDenganFlag.length === 0) {
      alert("❌ Pilih minimal 1 pupuk");
      return;
    }

    const ids = pupukDenganFlag.map((x) => x.pupuk.id);
    if (new Set(ids).size !== ids.length) {
      alert("❌ Ada pupuk yang dipilih dua kali. Hapus duplikatnya.");
      return;
    }

    // ===== STATUS HARA (mode presisi) =====
    let statusPresisi: {
      n: StatusHara;
      p: StatusHara;
      k: StatusHara;
      c: StatusHara;
      ph: "asam" | "netral" | "basa" | "-";
    } | null = null;

    let faktorN = 1;
    let faktorP = 1;
    let faktorK = 1;

    if (modeTanam === "presisi") {
      const nVal = parseFloat(nTotal) || 0;
      const pVal = parseFloat(pTersedia) || 0;
      const kVal = parseFloat(kTersedia) || 0;
      const cVal = parseFloat(cOrganik) || 0;
      const phVal = parseFloat(phPresisi) || 0;

      const sN: StatusHara = nTotal ? statusNTotal(nVal) : "tidak_diketahui";
      const sP: StatusHara = pTersedia
        ? statusPTersedia(pVal)
        : "tidak_diketahui";
      const sK: StatusHara = kTersedia
        ? statusKTersedia(kVal)
        : "tidak_diketahui";
      const sC: StatusHara = cOrganik
        ? statusCOrganik(cVal)
        : "tidak_diketahui";
      const sPH: "asam" | "netral" | "basa" | "-" = phPresisi
        ? statusPH(phVal)
        : "-";

      statusPresisi = { n: sN, p: sP, k: sK, c: sC, ph: sPH };

      if (sN !== "tidak_diketahui") faktorN = faktorKoreksi(sN);
      if (sP !== "tidak_diketahui") faktorP = faktorKoreksi(sP);
      if (sK !== "tidak_diketahui") faktorK = faktorKoreksi(sK);
    }

    // Faktor pengurangan organik
    const faktorKurangi =
      aktifkanKurangi && adaOrganik ? 1 - persenKurangi / 100 : 1;

    // Kebutuhan hara FINAL
    const nButuh = kebutuhan.n * luasHa * faktorN * faktorKurangi;
    const pButuh = kebutuhan.p * luasHa * faktorP * faktorKurangi;
    const kButuh = kebutuhan.k * luasHa * faktorK * faktorKurangi;

    const pupukNPK = pupukDenganFlag
      .filter((x) => isPupukKimia(x.pupuk))
      .map((x) => x.pupuk);

    const pupukNonNPK = pupukDenganFlag
      .filter(
        (x) =>
          x.pupuk.n_persen === 0 &&
          x.pupuk.p_persen === 0 &&
          x.pupuk.k_persen === 0
      )
      .map((x) => x.pupuk);

    const sumberN = pupukNPK.filter((p) => p.n_persen > 0);
    const sumberP = pupukNPK.filter((p) => p.p_persen > 0);
    const sumberK = pupukNPK.filter((p) => p.k_persen > 0);

    const warning: string[] = [];
    if (sumberN.length === 0 && nButuh > 0) {
      warning.push(
        "⚠️ Tidak ada pupuk sumber Nitrogen (N). Tambahkan Urea / Phonska / NPK."
      );
    }
    if (sumberP.length === 0 && pButuh > 0) {
      warning.push(
        "⚠️ Tidak ada pupuk sumber Fosfor (P). Tambahkan SP-36 / Phonska / NPK."
      );
    }
    if (sumberK.length === 0 && kButuh > 0) {
      warning.push(
        "⚠️ Tidak ada pupuk sumber Kalium (K). Tambahkan KCl / Phonska / NPK."
      );
    }

    const hasilPerPupuk = new Map<string, number>();
    pupukDenganFlag.forEach((x) => hasilPerPupuk.set(x.pupuk.id, 0));

    function alokasi(
      totalButuh: number,
      sumber: Pupuk[],
      field: "n_persen" | "p_persen" | "k_persen"
    ) {
      if (totalButuh <= 0 || sumber.length === 0) return;

      const totalKandungan = sumber.reduce(
        (s, p) => s + p[field] / 100,
        0
      );
      if (totalKandungan <= 0) return;

      sumber.forEach((p) => {
        const porsi = p[field] / 100 / totalKandungan;
        const haraDariPupuk = totalButuh * porsi;
        const pupukKg = haraDariPupuk / (p[field] / 100);
        hasilPerPupuk.set(
          p.id,
          (hasilPerPupuk.get(p.id) || 0) + pupukKg
        );
      });
    }

    alokasi(nButuh, sumberN, "n_persen");
    alokasi(pButuh, sumberP, "p_persen");
    alokasi(kButuh, sumberK, "k_persen");

    // Dolomit: prioritas pakai pH presisi
    const phEfektif =
      modeTanam === "presisi" && phPresisi
        ? parseFloat(phPresisi)
        : phTanah
        ? parseFloat(phTanah)
        : 0;

    pupukNonNPK.forEach((p) => {
      if (isDolomit(p)) {
        if (phEfektif > 0) {
          const dosis = hitungDolomitDariPH(phEfektif, luasHa);
          hasilPerPupuk.set(p.id, dosis);
        } else {
          const dosisDefault =
            (DOSIS_DEFAULT[komoditas]?.dolomit || 1000) * luasHa;
          hasilPerPupuk.set(p.id, dosisDefault);
        }
      } else if (isOrganik(p)) {
        const dosisDefault =
          (DOSIS_DEFAULT[komoditas]?.organik || 2000) * luasHa;
        hasilPerPupuk.set(p.id, dosisDefault);
      } else {
        hasilPerPupuk.set(p.id, 0);
      }
    });

    const hasilArr: HasilItem[] = pupukDenganFlag.map((x) => {
      const isKimia = isPupukKimia(x.pupuk);
      const isNonNPK =
        x.pupuk.n_persen === 0 &&
        x.pupuk.p_persen === 0 &&
        x.pupuk.k_persen === 0;
      return {
        nama: x.pupuk.merk
          ? `${x.pupuk.nama} (${x.pupuk.merk})`
          : x.pupuk.nama,
        kg: hasilPerPupuk.get(x.pupuk.id) || 0,
        n: x.pupuk.n_persen,
        p: x.pupuk.p_persen,
        k: x.pupuk.k_persen,
        unsurLain: x.pupuk.unsur_lain,
        isDasar: x.pupukDasar,
        isNonNPK,
        dikurangi: isKimia && faktorKurangi < 1,
      };
    });

    const totalKg = hasilArr.reduce((s, h) => s + h.kg, 0);

    // JADWAL
    let jadwal: HasilFase[] = [];

    const pupukSplit: { pupuk: Pupuk; pupukDasar: boolean }[] = [];
    const pupukFixedDasar: { pupuk: Pupuk }[] = [];

    pupukDenganFlag.forEach((x) => {
      if (isPupukAutoDasar(x.pupuk)) {
        pupukFixedDasar.push({ pupuk: x.pupuk });
      } else if (x.pupukDasar) {
        pupukFixedDasar.push({ pupuk: x.pupuk });
      } else {
        pupukSplit.push(x);
      }
    });

    if (modeJadwal === "custom") {
      jadwal = faseCustom.map((f) => ({
        fase: f.nama,
        waktu: f.hst,
        pupukCampur: [],
        pupukDasar: [],
        totalCampur: 0,
        mix: null,
      }));

      pupukSplit.forEach((x) => {
        const kg = hasilPerPupuk.get(x.pupuk.id) || 0;
        if (kg <= 0) return;
        const namaPupuk = x.pupuk.merk
          ? `${x.pupuk.nama} (${x.pupuk.merk})`
          : x.pupuk.nama;

        faseCustom.forEach((f, idx) => {
          const porsi = f.persen / 100;
          const kgFase = kg * porsi;
          if (kgFase > 0.01) {
            jadwal[idx].pupukCampur.push({ nama: namaPupuk, kg: kgFase });
          }
        });
      });

      pupukFixedDasar.forEach((x) => {
        const kg = hasilPerPupuk.get(x.pupuk.id) || 0;
        if (kg <= 0) return;
        const namaPupuk = x.pupuk.merk
          ? `${x.pupuk.nama} (${x.pupuk.merk})`
          : x.pupuk.nama;
        jadwal[0].pupukDasar.push({ nama: namaPupuk, kg });
      });
    } else {
      const konfigDefault = KONFIG_FASE[komoditas] || KONFIG_FASE.padi;
      const jadwalKomoditas = konfigDefault.default;
      jadwal = jadwalKomoditas.map((f) => ({
        fase: f.fase,
        waktu: f.waktu,
        pupukCampur: [],
        pupukDasar: [],
        totalCampur: 0,
        mix: null,
      }));

      pupukSplit.forEach((x) => {
        const kg = hasilPerPupuk.get(x.pupuk.id) || 0;
        if (kg <= 0) return;
        const namaPupuk = x.pupuk.merk
          ? `${x.pupuk.nama} (${x.pupuk.merk})`
          : x.pupuk.nama;

        if (modeJadwal === "sekali") {
          jadwal[0].pupukCampur.push({ nama: namaPupuk, kg });
        } else {
          const p = x.pupuk;
          let split: { dasar: number; susulan1: number; susulan2: number };

          if (p.n_persen > 0 && p.p_persen === 0 && p.k_persen === 0) {
            split = { dasar: 0.4, susulan1: 0.3, susulan2: 0.3 };
          } else if (
            p.n_persen === 0 &&
            p.p_persen === 0 &&
            p.k_persen > 0
          ) {
            split = { dasar: 0.5, susulan1: 0.5, susulan2: 0 };
          } else if (p.n_persen > 0 && p.p_persen > 0 && p.k_persen > 0) {
            split = { dasar: 0.5, susulan1: 0.5, susulan2: 0 };
          } else {
            split = { dasar: 1, susulan1: 0, susulan2: 0 };
          }

          if (split.dasar > 0) {
            jadwal[0].pupukCampur.push({
              nama: namaPupuk,
              kg: kg * split.dasar,
            });
          }
          if (split.susulan1 > 0 && jadwal.length > 1) {
            jadwal[1].pupukCampur.push({
              nama: namaPupuk,
              kg: kg * split.susulan1,
            });
          }
          if (split.susulan2 > 0 && jadwal.length > 2) {
            jadwal[2].pupukCampur.push({
              nama: namaPupuk,
              kg: kg * split.susulan2,
            });
          }
        }
      });

      pupukFixedDasar.forEach((x) => {
        const kg = hasilPerPupuk.get(x.pupuk.id) || 0;
        if (kg <= 0) return;
        const namaPupuk = x.pupuk.merk
          ? `${x.pupuk.nama} (${x.pupuk.merk})`
          : x.pupuk.nama;
        jadwal[0].pupukDasar.push({ nama: namaPupuk, kg });
      });
    }

    jadwal.forEach((f) => {
      f.totalCampur = f.pupukCampur.reduce((s, p) => s + p.kg, 0);
      if (f.pupukCampur.length >= 2 && f.totalCampur > 0) {
        const jumlahBagian = hitungJumlahBagian(f.totalCampur);
        f.mix = {
          totalBagian: jumlahBagian,
          urutan: [...f.pupukCampur].sort((a, b) => a.kg - b.kg),
          langkah: generateLangkahMix(f.pupukCampur, jumlahBagian),
        };
      }
    });

    if (modeJadwal === "sekali") {
      warning.unshift(
        "⚠️ Anda memilih pemupukan 1x (tanpa split). Unsur Nitrogen (Urea/ZA) mudah hilang melalui penguapan & pencucian air. Risiko: tanaman kurang N di fase generatif, pemborosan biaya, pertumbuhan tidak merata. Rekomendasi Kementan: split 2-3x untuk efisiensi."
      );
    }

    if (modeJadwal === "custom") {
      warning.unshift(
        "✏️ Mode Custom Split aktif. Pastikan porsi & HST sesuai kondisi lahan. Pupuk dasar akan otomatis masuk fase 1 dan tidak dicampur."
      );
    }

    if (aktifkanKurangi && adaOrganik) {
      warning.unshift(
        `🌱 Pengurangan pupuk kimia ${persenKurangi}% aktif (karena pakai organik). Berdasarkan riset Kementan & Balitbangtan, kombinasi organik + pengurangan pupuk anorganik 25-50% masih aman untuk produktivitas.`
      );
    }

    if (aktifkanKurangi && !adaOrganik) {
      warning.unshift(
        "⚠️ Anda mengaktifkan pengurangan pupuk, tapi belum pilih pupuk organik. Pengurangan tidak diterapkan."
      );
    }

    if (modeTanam === "presisi") {
      warning.unshift(
        "🔬 Mode Presisi aktif. Dosis dikoreksi berdasarkan status hara tanah: rendah +25%, tinggi -25%. Pastikan hasil analisis tanah akurat."
      );
    }

    const adaDolomit = pupukDenganFlag.some((x) =>
      isDolomit(x.pupuk)
    );
    if (adaDolomit && phEfektif <= 0) {
      warning.unshift(
        "💡 Dosis Dolomit dihitung pakai default. Isi pH tanah (di form presisi) untuk dosis yang lebih akurat."
      );
    }

    setHasil({
      kebutuhan: hasilArr,
      totalKg,
      benih: {
        min: kebutuhan.benih_min * luasHa,
        max: kebutuhan.benih_max * luasHa,
        satuan: kebutuhan.satuan_benih,
      },
      warning,
      jadwal,
      modeJadwal,
      kurangiAktif: aktifkanKurangi && adaOrganik,
      persenKurangi,
      statusPresisi,
    });
  }

  function reset() {
    setBaris([{ id: "b1", pupukId: "", pupukDasar: false }]);
    setHasil(null);
    setAktifkanKurangi(false);
    setPersenKurangi(25);
    setPhTanah("");
    setNTotal("");
    setPTersedia("");
    setKTersedia("");
    setCOrganik("");
    setPhPresisi("");
  }

  const pupukTersedia = pupuks.filter((p) => p.is_active);

  const adaNonNPK = baris.some((b) => {
    const p = pupuks.find((x) => x.id === b.pupukId);
    if (!p) return false;
    return isPupukAutoDasar(p) || isDolomit(p);
  });

  return (
    <div className="space-y-4">
      {/* TOGGLE MODE TANAM */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-3">
          Metode Pemupukan
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setModeTanam("standar")}
            className={`py-3 rounded-xl text-xs font-bold transition ${
              modeTanam === "standar"
                ? "bg-[#2c5e2e] text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            📋 Pemupukan Standar
          </button>
          <button
            onClick={() => setModeTanam("presisi")}
            className={`py-3 rounded-xl text-xs font-bold transition ${
              modeTanam === "presisi"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            🔬 Pemupukan Presisi
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
          {modeTanam === "standar"
            ? "Pakai dosis anjuran umum Kementan/Balitbangtan untuk semua lahan."
            : "Pakai hasil analisis tanah untuk dosis yang disesuaikan kondisi lahan Anda."}
        </p>
      </div>

      <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-4">
        <p className="text-xs text-[#2c5e2e] leading-relaxed">
          💡 Pilih lahan atau input luas manual, pilih komoditas, lalu
          tambahkan pupuk yang biasa Anda pakai (1 atau lebih).
        </p>
      </div>

      {/* LAHAN / MANUAL */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode("lahan")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === "lahan"
                ? "bg-[#2c5e2e] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            📍 Pilih Lahan
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === "manual"
                ? "bg-[#2c5e2e] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            ✏️ Input Manual
          </button>
        </div>

        {mode === "lahan" ? (
          <div>
            <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">
              Pilih Lahan
            </label>
            <select
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429]"
            >
              <option value="">-- Pilih Lahan --</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama} — {l.luas} Ha
                </option>
              ))}
            </select>
            {luasHa > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Luas: <strong>{luasHa.toFixed(3)} Ha</strong>
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">
              Luas Lahan (Hektar)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={luasManual}
              onChange={(e) => setLuasManual(e.target.value)}
              placeholder="Contoh: 0.5"
              className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429]"
            />
            {luasHa > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {luasHa.toFixed(3)} Ha = {(luasHa * 10000).toFixed(0)} m²
              </p>
            )}
          </div>
        )}
      </div>

      {/* KOMODITAS */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">
          Pilih Komoditas
        </label>
        <select
          value={komoditas}
          onChange={(e) => {
            setKomoditas(e.target.value);
            const konfig = KONFIG_FASE[e.target.value] || KONFIG_FASE.padi;
            const defaultFase: FaseCustom[] = konfig.default.map((f, i) => ({
              id: "fc" + i + Date.now(),
              nama: f.fase,
              hst: f.waktu,
              persen: Math.round(100 / konfig.default.length),
            }));
            const totalPersen = defaultFase.reduce(
              (s, f) => s + f.persen,
              0
            );
            defaultFase[0].persen += 100 - totalPersen;
            setFaseCustom(defaultFase);
          }}
          className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429]"
        >
          {Object.entries(KOMODITAS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {KEBUTUHAN_HARA[komoditas] && (
          <p className="text-[10px] text-gray-500 mt-2">
            Kebutuhan hara per Ha:{" "}
            <strong>N {KEBUTUHAN_HARA[komoditas].n} kg</strong>,{" "}
            <strong>P₂O₅ {KEBUTUHAN_HARA[komoditas].p} kg</strong>,{" "}
            <strong>K₂O {KEBUTUHAN_HARA[komoditas].k} kg</strong>
          </p>
        )}
      </div>

      {/* FORM PRESISI */}
      {modeTanam === "presisi" && (
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-base">
              🔬
            </div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Hasil Analisis Tanah (opsional)
            </div>
          </div>

          <p className="text-[10px] text-gray-500 leading-relaxed">
            Isi sesuai hasil uji lab / alat ukur tanah. Kosongkan kalau belum
            ada — sistem akan pakai dosis anjuran umum untuk unsur yang
            kosong.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                N Total (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={nTotal}
                onChange={(e) => setNTotal(e.target.value)}
                placeholder="0.3"
                className="w-full border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {nTotal && (
                <div
                  className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full border font-bold ${
                    STATUS_COLOR[statusNTotal(parseFloat(nTotal))]
                  }`}
                >
                  {STATUS_LABEL[statusNTotal(parseFloat(nTotal))]}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                P Tersedia (ppm)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pTersedia}
                onChange={(e) => setPTersedia(e.target.value)}
                placeholder="15"
                className="w-full border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {pTersedia && (
                <div
                  className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full border font-bold ${
                    STATUS_COLOR[statusPTersedia(parseFloat(pTersedia))]
                  }`}
                >
                  {STATUS_LABEL[statusPTersedia(parseFloat(pTersedia))]}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                K Tersedia (ppm)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={kTersedia}
                onChange={(e) => setKTersedia(e.target.value)}
                placeholder="30"
                className="w-full border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {kTersedia && (
                <div
                  className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full border font-bold ${
                    STATUS_COLOR[statusKTersedia(parseFloat(kTersedia))]
                  }`}
                >
                  {STATUS_LABEL[statusKTersedia(parseFloat(kTersedia))]}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                C-Organik (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cOrganik}
                onChange={(e) => setCOrganik(e.target.value)}
                placeholder="2.5"
                className="w-full border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {cOrganik && (
                <div
                  className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full border font-bold ${
                    STATUS_COLOR[statusCOrganik(parseFloat(cOrganik))]
                  }`}
                >
                  {STATUS_LABEL[statusCOrganik(parseFloat(cOrganik))]}
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                pH Tanah
              </label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="9"
                value={phPresisi}
                onChange={(e) => setPhPresisi(e.target.value)}
                placeholder="5.5"
                className="w-full border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              {phPresisi && (
                <div
                  className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full border font-bold ${
                    statusPH(parseFloat(phPresisi)) === "asam"
                      ? "bg-red-100 text-red-800 border-red-300"
                      : statusPH(parseFloat(phPresisi)) === "netral"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}
                >
                  {statusPH(parseFloat(phPresisi)) === "asam"
                    ? "Asam"
                    : statusPH(parseFloat(phPresisi)) === "netral"
                    ? "Netral"
                    : "Basa"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* pH TANAH (muncul di mode standar kalau ada dolomit) */}
      {modeTanam === "standar" && adaNonNPK && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4">
          <label className="block text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">
            🌱 pH Tanah (opsional, untuk dosis Dolomit)
          </label>
          <input
            type="number"
            step="0.1"
            min="3"
            max="9"
            value={phTanah}
            onChange={(e) => setPhTanah(e.target.value)}
            placeholder="Contoh: 5.5"
            className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* PUPUK */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-3">
          Pupuk yang Akan Dipakai
        </label>

        <div className="space-y-2">
          {baris.map((b, idx) => {
            const pupukTerpilih = pupuks.find((p) => p.id === b.pupukId);
            const autoDasar = pupukTerpilih
              ? isPupukAutoDasar(pupukTerpilih)
              : false;
            const pupukP = pupukTerpilih ? isPupukP(pupukTerpilih) : false;
            const showCheckbox = pupukTerpilih && (pupukP || autoDasar);

            return (
              <div
                key={b.id}
                className="border border-[#2c5e2e]/15 rounded-xl p-3 space-y-2"
              >
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select
                      value={b.pupukId}
                      onChange={(e) => updateBaris(b.id, e.target.value)}
                      className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]"
                    >
                      <option value="">-- Pilih Pupuk #{idx + 1} --</option>
                      {pupukTersedia.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                          {p.merk ? ` (${p.merk})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {baris.length > 1 && (
                    <button
                      onClick={() => hapusBaris(b.id)}
                      className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold flex items-center justify-center flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showCheckbox && (
                  <label
                    className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-2 ${
                      autoDasar
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-amber-50 border border-amber-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={b.pupukDasar}
                      onChange={() => togglePupukDasar(b.id)}
                      disabled={autoDasar}
                      className="w-4 h-4 accent-[#2c5e2e]"
                    />
                    <span className="text-[11px] font-medium text-[#2c5e2e]">
                      🌱 Jadikan <strong>Pupuk Dasar</strong> (aplikasi
                      terpisah)
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={tambahBaris}
          className="mt-3 text-sm font-bold text-[#2c5e2e] hover:text-[#1f4521] px-4 py-2 rounded-xl border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] transition w-full"
        >
          + Tambah Pupuk
        </button>
      </div>

      {/* PENGURANGAN PUPUK KIMIA */}
      {adaOrganik && (
        <div className="bg-white border-2 border-green-300 rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aktifkanKurangi}
              onChange={(e) => setAktifkanKurangi(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-xs font-bold text-green-800">
              🌱 Kurangi pupuk kimia karena pakai organik (opsional)
            </span>
          </label>

          {aktifkanKurangi && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setPersenKurangi(25)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    persenKurangi === 25
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Kurangi 25%
                </button>
                <button
                  onClick={() => setPersenKurangi(50)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                    persenKurangi === 50
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Kurangi 50%
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-[10px] text-green-800 leading-relaxed">
                <strong>📚 Dasar:</strong> Kombinasi organik + pengurangan
                pupuk anorganik 25-50% sudah terbukti aman (riset Kementan &
                Balitbangtan).
              </div>
            </>
          )}
        </div>
      )}

      {/* MODE JADWAL */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-3">
          Mode Pemupukan
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setModeJadwal("split")}
            className={`py-2.5 rounded-xl text-[10px] font-bold transition ${
              modeJadwal === "split"
                ? "bg-[#2c5e2e] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            📅 Split
          </button>
          <button
            onClick={() => setModeJadwal("sekali")}
            className={`py-2.5 rounded-xl text-[10px] font-bold transition ${
              modeJadwal === "sekali"
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            💰 1x Apply
          </button>
          <button
            onClick={() => setModeJadwal("custom")}
            className={`py-2.5 rounded-xl text-[10px] font-bold transition ${
              modeJadwal === "custom"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            ✏️ Custom
          </button>
        </div>
      </div>

      {/* FASE CUSTOM EDITOR */}
      {modeJadwal === "custom" && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-bold text-purple-800 uppercase tracking-widest">
              ✏️ Atur Fase
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={tambahFase}
                disabled={faseCustom.length >= konfigFase.max}
                className="text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full transition disabled:opacity-40"
              >
                + Fase
              </button>
              <button
                onClick={ratakanFase}
                className="text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full"
              >
                ↕️ Rata
              </button>
              <button
                onClick={resetFaseCustom}
                className="text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-full"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {faseCustom.map((f, idx) => (
              <div
                key={f.id}
                className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-800 flex-shrink-0 w-12">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={f.nama}
                    onChange={(e) =>
                      updateFase(f.id, "nama", e.target.value)
                    }
                    className="flex-1 border border-purple-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500 bg-white"
                  />
                  {faseCustom.length > konfigFase.min && (
                    <button
                      onClick={() => hapusFase(f.id)}
                      className="w-7 h-7 rounded-lg bg-red-100 text-red-600 text-xs font-bold flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-purple-800 uppercase block mb-0.5">
                      Waktu (HST)
                    </label>
                    <input
                      type="text"
                      value={f.hst}
                      onChange={(e) =>
                        updateFase(f.id, "hst", e.target.value)
                      }
                      className="w-full border border-purple-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-purple-800 uppercase block mb-0.5">
                      Porsi (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={f.persen}
                      onChange={(e) =>
                        updateFase(
                          f.id,
                          "persen",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full border border-purple-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`rounded-xl p-3 text-xs font-bold text-center ${
              totalPersenCustom === 100
                ? "bg-green-50 border-2 border-green-300 text-green-800"
                : "bg-red-50 border-2 border-red-300 text-red-800"
            }`}
          >
            Total: {totalPersenCustom}%{" "}
            {totalPersenCustom === 100 ? "✅" : "❌"}
          </div>
        </div>
      )}

      {/* TOMBOL */}
      <div className="flex gap-2">
        <button
          onClick={hitung}
          disabled={
            luasHa <= 0 ||
            (modeJadwal === "custom" && totalPersenCustom !== 100)
          }
          className="flex-1 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition disabled:opacity-50"
        >
          🧮 Hitung Kebutuhan
        </button>
        <button
          onClick={reset}
          className="bg-white hover:bg-red-50 text-red-600 font-bold py-3.5 px-5 rounded-full border-2 border-red-200 transition"
        >
          🔄
        </button>
      </div>

      {/* HASIL */}
      {hasil && (
        <div className="bg-white border-4 border-[#f0b429] rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f0b429] flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <div className="font-bold text-[#2c5e2e]">Hasil Perhitungan</div>
              <div className="text-xs text-gray-500">
                Untuk {luasHa.toFixed(3)} Ha · {KOMODITAS_LABEL[komoditas]}
              </div>
            </div>
          </div>

          {hasil.statusPresisi && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">
                🔬 Status Hara Tanah
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  className={`rounded-lg px-2 py-1.5 border text-center font-bold ${
                    STATUS_COLOR[hasil.statusPresisi.n]
                  }`}
                >
                  N: {STATUS_LABEL[hasil.statusPresisi.n]}
                </div>
                <div
                  className={`rounded-lg px-2 py-1.5 border text-center font-bold ${
                    STATUS_COLOR[hasil.statusPresisi.p]
                  }`}
                >
                  P: {STATUS_LABEL[hasil.statusPresisi.p]}
                </div>
                <div
                  className={`rounded-lg px-2 py-1.5 border text-center font-bold ${
                    STATUS_COLOR[hasil.statusPresisi.k]
                  }`}
                >
                  K: {STATUS_LABEL[hasil.statusPresisi.k]}
                </div>
                <div
                  className={`rounded-lg px-2 py-1.5 border text-center font-bold ${
                    STATUS_COLOR[hasil.statusPresisi.c]
                  }`}
                >
                  C-Org: {STATUS_LABEL[hasil.statusPresisi.c]}
                </div>
                <div className="col-span-2 rounded-lg px-2 py-1.5 border text-center font-bold bg-gray-100 text-gray-700 border-gray-300">
                  pH: {hasil.statusPresisi.ph}
                </div>
              </div>
            </div>
          )}

          {hasil.kurangiAktif && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-xs font-bold text-green-800">
              🌱 Pengurangan pupuk kimia {hasil.persenKurangi}% AKTIF
            </div>
          )}

          {hasil.warning.length > 0 && (
            <div className="space-y-2">
              {hasil.warning.map((w, i) => (
                <div
                  key={i}
                  className={`border-2 rounded-xl p-3 text-xs font-medium ${
                    w.includes("⚠️ Anda memilih")
                      ? "bg-red-50 border-red-300 text-red-800"
                      : w.includes("✏️ Mode Custom")
                      ? "bg-purple-50 border-purple-300 text-purple-800"
                      : w.includes("🔬 Mode Presisi")
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : w.includes("💡")
                      ? "bg-blue-50 border-blue-300 text-blue-800"
                      : w.includes("🌱 Pengurangan")
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* KEBUTUHAN */}
          <div>
            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              Kebutuhan Pupuk
            </div>
            <div className="space-y-2">
              {hasil.kebutuhan.map((h, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center rounded-xl p-3 ${
                    h.isDasar
                      ? "bg-blue-50 border border-blue-200"
                      : h.dikurangi
                      ? "bg-green-50 border border-green-200"
                      : "bg-[#2c5e2e]/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#2c5e2e] truncate">
                      {h.isDasar && "🌱 "}
                      {h.dikurangi && "📉 "}
                      {h.nama}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {h.isNonNPK
                        ? h.unsurLain || "Pupuk dasar / pembenah tanah"
                        : `N ${h.n}% · P ${h.p}% · K ${h.k}%`}
                      {h.isDasar && " · Pupuk Dasar"}
                      {h.dikurangi && ` · Dikurangi ${hasil.persenKurangi}%`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-lg font-bold text-[#2c5e2e]">
                      {h.kg.toFixed(2)} kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between items-center bg-[#2c5e2e] text-white rounded-xl p-3">
              <div className="font-bold text-sm">TOTAL PUPUK</div>
              <div className="text-lg font-bold">
                {hasil.totalKg.toFixed(2)} kg
              </div>
            </div>
          </div>

          {/* JADWAL */}
          <div>
            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              📅 Jadwal Pemupukan
            </div>
            <div className="space-y-3">
              {hasil.jadwal.map((f, i) => {
                const faseKosong =
                  f.pupukCampur.length === 0 && f.pupukDasar.length === 0;
                return (
                  <div
                    key={i}
                    className={`border-2 rounded-xl p-3 ${
                      faseKosong
                        ? "bg-gray-50 border-gray-200 opacity-50"
                        : "bg-[#f0b429]/10 border-[#f0b429]/40"
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-2 flex-wrap gap-1">
                      <div className="font-bold text-[#2c5e2e] text-sm">
                        {f.fase}
                      </div>
                      <div className="text-[10px] font-bold text-[#f0b429] bg-[#2c5e2e] px-2 py-0.5 rounded-full">
                        {f.waktu}
                      </div>
                    </div>

                    {faseKosong ? (
                      <div className="text-[10px] text-gray-400 italic">
                        Tidak ada pupuk di fase ini
                      </div>
                    ) : (
                      <>
                        {f.pupukDasar.length > 0 && (
                          <div className="mb-3 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">
                              🌱 Pupuk Dasar (Aplikasi Terpisah)
                            </div>
                            <div className="space-y-1 mb-2">
                              {f.pupukDasar.map((p, j) => (
                                <div
                                  key={j}
                                  className="flex justify-between items-center text-xs bg-white rounded-lg px-3 py-1.5"
                                >
                                  <span className="text-blue-900 font-medium truncate min-w-0">
                                    {p.nama}
                                  </span>
                                  <span className="font-bold text-blue-900 flex-shrink-0 ml-2">
                                    {p.kg.toFixed(2)} kg
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-blue-800 leading-relaxed bg-white rounded-lg p-2">
                              📌 Tabur merata{" "}
                              <strong>2-4 minggu sebelum tanam</strong>. Tidak
                              perlu dicampur dengan pupuk lain.
                            </div>
                          </div>
                        )}

                        {f.pupukCampur.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                              🔀 Pupuk yang Dicampur
                            </div>
                            <div className="space-y-1 mb-2">
                              {f.pupukCampur.map((p, j) => (
                                <div
                                  key={j}
                                  className="flex justify-between items-center text-xs bg-white rounded-lg px-3 py-1.5"
                                >
                                  <span className="text-[#2c5e2e] font-medium truncate min-w-0">
                                    {p.nama}
                                  </span>
                                  <span className="font-bold text-[#2c5e2e] flex-shrink-0 ml-2">
                                    {p.kg.toFixed(2)} kg
                                  </span>
                                </div>
                              ))}
                            </div>

                            {f.mix && f.pupukCampur.length >= 2 && (
                              <div className="mt-2 pt-2 border-t border-[#2c5e2e]/15">
                                <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                                  Cara Mencampur ({f.totalCampur.toFixed(1)} kg)
                                </div>

                                <div className="bg-white rounded-xl p-3 text-[11px] text-[#2c5e2e] leading-relaxed mb-2">
                                  <strong>Urutan (sedikit → banyak):</strong>
                                  <div className="mt-1 space-y-0.5">
                                    {f.mix.urutan.map((p, k) => (
                                      <div
                                        key={k}
                                        className="flex justify-between"
                                      >
                                        <span className="truncate">
                                          {k + 1}. {p.nama}
                                        </span>
                                        <span className="font-bold ml-2 flex-shrink-0">
                                          {p.kg.toFixed(2)} kg
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl p-3 space-y-2">
                                  {f.mix.langkah.map((l, k) => (
                                    <div key={k} className="text-[11px]">
                                      <div className="font-bold text-[#2c5e2e]">
                                        {l.langkah}
                                      </div>
                                      <div className="text-gray-600 leading-relaxed">
                                        {l.detail}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {f.pupukCampur.length === 1 && (
                              <div className="mt-2 text-[10px] text-gray-500 italic">
                                Cuma 1 pupuk — langsung tabur merata.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BENIH */}
          <div>
            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              Kebutuhan Benih
            </div>
            <div className="bg-[#f0b429]/15 border-2 border-[#f0b429]/40 rounded-xl p-3">
              <div className="text-sm font-semibold text-[#2c5e2e]">
                🌱 {hasil.benih.min.toFixed(2)} –{" "}
                {hasil.benih.max.toFixed(2)} {hasil.benih.satuan}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Untuk {luasHa.toFixed(3)} Ha
              </div>
            </div>
          </div>

          {/* SUMBER DATA */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] text-gray-600 leading-relaxed space-y-1">
            <div className="font-bold text-gray-700">📚 Sumber Data:</div>
            <div>
              • <strong>Dosis hara per komoditas:</strong> Kepmentan 75/2019,
              Permentan 40/2007, Balitbangtan
            </div>
            <div>
              • <strong>Dosis dolomit menurut pH:</strong> Buku Ajar Kesuburan
              Tanah & Pemupukan (2024), repository.pertanian.go.id
            </div>
            <div>
              • <strong>Pupuk organik:</strong> 2 t/ha (standar Balitbangtan)
            </div>
            <div>
              • <strong>Pengurangan pupuk kimia 25-50%:</strong> Riset
              Kementan, Universitas Brawijaya, Jurnal Hortikultura Indonesia
            </div>
            {modeTanam === "presisi" && (
              <div>
                • <strong>Status hara tanah (N/P/K/C/pH):</strong>{" "}
                Puslittanak, Balitbangtan — Buku Petunjuk Pengambilan Contoh
                Tanah
              </div>
            )}
            <div>
              • <strong>Sifat hara (mobility):</strong> FAO Fertilizer &
              Plant Nutrition Bulletin
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[11px] text-gray-600 leading-relaxed">
        <strong>Catatan:</strong> Hasil perhitungan ini bersifat panduan.
        Konsultasi dengan penyuluh pertanian untuk hasil terbaik. Kondisi
        aktual bisa berbeda tergantung varietas, iklim, dan kondisi tanah.
      </div>
    </div>
  );
}
