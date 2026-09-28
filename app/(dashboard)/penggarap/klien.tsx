"use client";

import { useState } from "react";
import Link from "next/link";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const KATEGORI = {
  padi: { cukup: 5000, baik: 6000, sangatBaik: 7000 },
  jagung: { cukup: 5000, baik: 6500, sangatBaik: 8000 },
  cabai_rawit: { cukup: 4000, baik: 6000, sangatBaik: 8000 },
};

function hitungKategoriLokal(prod: number, komoditas: string) {
  const k = KATEGORI[komoditas as keyof typeof KATEGORI];
  if (!k) return null;
  if (prod >= k.sangatBaik)
    return { icon: "⭐⭐⭐", label: "SANGAT BAIK", color: "text-green-800 bg-green-100 border-green-300" };
  if (prod >= k.baik)
    return { icon: "⭐⭐", label: "BAIK", color: "text-blue-800 bg-blue-100 border-blue-300" };
  if (prod >= k.cukup)
    return { icon: "⭐", label: "CUKUP", color: "text-orange-800 bg-orange-100 border-orange-300" };
  return { icon: "⚠️", label: "KURANG OPTIMAL", color: "text-red-800 bg-red-100 border-red-300" };
}

type KomoditasRingkas = {
  komoditas: string;
  jml: number;
  isPerMusim: boolean;
  totalHasilKg: number;
};

type TahunRingkas = {
  tahun: number;
  komoditasList: string[];
  totalHasilKg: number;
  jmlPanenRaw: number;
  jmlMusim: number;
  profitOwner: number;
  profitPenggarap: number;
};

type RiwayatPanen = {
  id: string;
  tanggal: string;
  komoditas: string;
  musim: string | null;
  hasilKg: number;
  hargaGabah: number;
  profitBersih: number;
  profitOwner: number;
  profitPenggarap: number;
  potonganHutang: number;
  sisaHutangSesudah: number;
  totalHutangSebelum: number;
  persenOwner?: number;
  persenPenggarap?: number;
};

type LahanItem = {
  id: string;
  nama: string;
  luas: number;
  lokasi_koordinat: string | null;
  jmlPanen: number;
  totalHasilKg: number;
  rataProduktivitas: number;
  komoditasList: string[];
  komoditasRingkas: KomoditasRingkas[];
  tahunRingkas: TahunRingkas[];
  riwayatPanen: RiwayatPanen[];
};

type PenggarapLengkap = {
  id: string;
  nama: string;
  kontak: string | null;
  alamat: string | null;
  totalLahan: number;
  totalLuas: number;
  jmlPanen: number;
  komoditasDitanam: string[];
  produktivitas: {
    komoditas: string;
    produktivitasRata: number;
    jmlPanen: number;
    totalHasilKg: number;
    kategori: { label: string; icon: string; color: string } | null;
  }[];
  lahanList: LahanItem[];
};

type Props = {
  penggarapLengkap: PenggarapLengkap[];
};

export function PenggarapKlien({ penggarapLengkap }: Props) {
  const [expandedPenggarap, setExpandedPenggarap] = useState<string | null>(null);
  const [expandedLahan, setExpandedLahan] = useState<string | null>(null);
  const [expandedTahun, setExpandedTahun] = useState<string | null>(null);
  const [expandedMusim, setExpandedMusim] = useState<string | null>(null);

  function togglePenggarap(id: string) {
    if (expandedPenggarap === id) {
      setExpandedPenggarap(null);
      setExpandedLahan(null);
      setExpandedTahun(null);
      setExpandedMusim(null);
    } else {
      setExpandedPenggarap(id);
      setExpandedLahan(null);
      setExpandedTahun(null);
      setExpandedMusim(null);
    }
  }

  function toggleLahan(id: string) {
    if (expandedLahan === id) {
      setExpandedLahan(null);
      setExpandedTahun(null);
      setExpandedMusim(null);
    } else {
      setExpandedLahan(id);
      setExpandedTahun(null);
      setExpandedMusim(null);
    }
  }

  function toggleTahun(key: string) {
    if (expandedTahun === key) {
      setExpandedTahun(null);
      setExpandedMusim(null);
    } else {
      setExpandedTahun(key);
      setExpandedMusim(null);
    }
  }

  function toggleMusim(key: string) {
    if (expandedMusim === key) {
      setExpandedMusim(null);
    } else {
      setExpandedMusim(key);
    }
  }

  function kelompokkanPerTahun(riwayat: RiwayatPanen[], luasLahan: number) {
    const tahunMap = new Map<
      number,
      {
        cabaiMusimMap: Map<string, RiwayatPanen[]>;
        single: RiwayatPanen[];
      }
    >();

    riwayat.forEach((h) => {
      const tahun = new Date(h.tanggal).getFullYear();
      if (!tahunMap.has(tahun)) {
        tahunMap.set(tahun, {
          cabaiMusimMap: new Map(),
          single: [],
        });
      }
      const t = tahunMap.get(tahun)!;
      const isCabai = h.komoditas === "cabai_rawit" || h.komoditas === "cabai";
      if (isCabai && h.musim) {
        if (!t.cabaiMusimMap.has(h.musim)) t.cabaiMusimMap.set(h.musim, []);
        t.cabaiMusimMap.get(h.musim)!.push(h);
      } else {
        t.single.push(h);
      }
    });

    const tahunArr = Array.from(tahunMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([tahun, data]) => {
        const musimArr = Array.from(data.cabaiMusimMap.entries()).map(
          ([musim, panenList]) => {
            const sorted = [...panenList].sort(
              (a, b) =>
                new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            );
            const totalHasilKg = panenList.reduce((s, h) => s + h.hasilKg, 0);
            const produktivitas = luasLahan > 0 ? totalHasilKg / luasLahan : 0;
            const totalProfitOwner = panenList.reduce(
              (s, h) => s + h.profitOwner,
              0
            );
            const totalProfitPenggarap = panenList.reduce(
              (s, h) => s + h.profitPenggarap,
              0
            );
            const totalPotongan = panenList.reduce(
              (s, h) => s + (h.potonganHutang || 0),
              0
            );
            const panenTerakhirByTgl = [...panenList].sort(
              (a, b) =>
                new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            )[0];
            const sisaHutangAkhirReal =
              panenTerakhirByTgl?.sisaHutangSesudah || 0;

            return {
              musim,
              totalHasilKg,
              jmlPanen: panenList.length,
              produktivitas,
              totalProfitOwner,
              totalProfitPenggarap,
              totalPotongan,
              sisaHutangAkhir: sisaHutangAkhirReal,
              panenList: sorted,
              tanggalMulai: sorted[sorted.length - 1]?.tanggal || "",
            };
          }
        );

        const single = [...data.single].sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

        const items: Array<
          | { tipe: "musim"; data: (typeof musimArr)[0] }
          | { tipe: "single"; data: RiwayatPanen }
        > = [
          ...musimArr.map((m) => ({ tipe: "musim" as const, data: m })),
          ...single.map((s) => ({ tipe: "single" as const, data: s })),
        ];

        items.sort((a, b) => {
          const tglA = a.tipe === "musim" ? a.data.tanggalMulai : a.data.tanggal;
          const tglB = b.tipe === "musim" ? b.data.tanggalMulai : b.data.tanggal;
          return new Date(tglB).getTime() - new Date(tglA).getTime();
        });

        return { tahun, items };
      });

    return tahunArr;
  }

  // ✅ Komponen bagi hasil 2 tahap — FIX FONT AGAR TIDAK KEPOTONG
  function BagiHasilBox({
    profitBersih,
    profitOwnerFinal,
    profitPenggarapFinal,
    potonganHutang,
    sisaHutangSesudah,
    persenOwner,
    persenPenggarap,
  }: {
    profitBersih: number;
    profitOwnerFinal: number;
    profitPenggarapFinal: number;
    potonganHutang: number;
    sisaHutangSesudah: number;
    persenOwner: number;
    persenPenggarap: number;
  }) {
    const profitOwnerMurni = profitBersih * (persenOwner / 100);
    const profitPenggarapMurni = profitBersih * (persenPenggarap / 100);
    const adaPotongan = potonganHutang > 0;
    const lunas = adaPotongan && sisaHutangSesudah <= 0;

    return (
      <div className="space-y-2">
        {/* TAHAP 1: BAGI HASIL DASAR */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="text-[10px] font-bold text-blue-800 uppercase mb-1">
            Bagi Hasil Dasar ({persenOwner}:{persenPenggarap})
          </div>
          <div className="text-[9px] text-blue-600 mb-1.5">
            Profit Bersih:{" "}
            <span className="font-bold">{formatRp(profitBersih)}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-white border border-green-200 rounded p-1.5 text-center min-w-0">
              <div className="text-[9px] text-green-800 font-medium">
                👤 Owner ({persenOwner}%)
              </div>
              <div className="font-bold text-green-900 text-[10px] break-all leading-tight">
                {formatRp(profitOwnerMurni)}
              </div>
            </div>
            <div className="bg-white border border-orange-200 rounded p-1.5 text-center min-w-0">
              <div className="text-[9px] text-orange-800 font-medium">
                👨‍🌾 Penggarap ({persenPenggarap}%)
              </div>
              <div className="font-bold text-orange-900 text-[10px] break-all leading-tight">
                {formatRp(profitPenggarapMurni)}
              </div>
            </div>
          </div>
        </div>

        {/* TAHAP 2: SETELAH POTONG HUTANG */}
        {adaPotongan && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2">
            <div className="text-[10px] font-bold text-red-800 uppercase mb-1">
              Setelah Potong Hutang
            </div>
            <div className="text-[9px] text-red-700 mb-1.5 flex items-center justify-between flex-wrap gap-1">
              <span>
                💸 Potong:{" "}
                <span className="font-bold">
                  − {formatRp(potonganHutang)}
                </span>
              </span>
              {lunas ? (
                <span className="bg-green-200 text-green-900 px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                  🎉 LUNAS
                </span>
              ) : (
                <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold text-[9px]">
                  Sisa: {formatRp(sisaHutangSesudah)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white border-2 border-green-400 rounded p-1.5 text-center min-w-0">
                <div className="text-[9px] text-green-800 font-bold">
                  👤 Owner
                </div>
                <div className="font-bold text-green-900 text-[10px] break-all leading-tight">
                  {formatRp(profitOwnerFinal)}
                </div>
              </div>
              <div className="bg-white border-2 border-orange-400 rounded p-1.5 text-center min-w-0">
                <div className="text-[9px] text-orange-800 font-bold">
                  👨‍🌾 Penggarap
                </div>
                <div className="font-bold text-orange-900 text-[10px] break-all leading-tight">
                  {formatRp(profitPenggarapFinal)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {penggarapLengkap.map((p) => {
        const isExpanded = expandedPenggarap === p.id;

        return (
          <div
            key={p.id}
            className={`bg-white border-2 rounded-2xl overflow-hidden transition ${
              isExpanded ? "border-green-500 shadow-lg" : "border-gray-200"
            }`}
          >
            <button
              onClick={() => togglePenggarap(p.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-lg text-gray-900">
                      👨‍🌾 {p.nama}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-0.5">
                    {p.kontak && <span>📞 {p.kontak}</span>}
                    {p.alamat && <span>📍 {p.alamat}</span>}
                  </div>
                  <div className="text-xs text-gray-700 mt-1 font-medium flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>🗺️ {p.totalLahan} lahan</span>
                    <span>📏 {p.totalLuas.toFixed(2)} Ha</span>
                    <span>🌾 {p.jmlPanen}x panen</span>
                  </div>
                  {p.komoditasDitanam.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.komoditasDitanam.map((kom) => (
                        <span
                          key={kom}
                          className="text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full px-2 py-0.5 font-medium"
                        >
                          {KOMODITAS_LABEL[kom] || kom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-gray-500 text-xl transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="bg-white rounded-xl p-3">
                  <div className="text-xs font-bold text-gray-700 uppercase mb-2">
                    🗺️ Daftar Lahan ({p.lahanList.length})
                  </div>
                  {p.lahanList.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 italic text-sm">
                      Belum ada lahan
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {p.lahanList.map((l) => {
                        const isLahanExpanded = expandedLahan === l.id;
                        const tahunKelompok = isLahanExpanded
                          ? kelompokkanPerTahun(l.riwayatPanen, l.luas)
                          : [];

                        return (
                          <div
                            key={l.id}
                            className={`border-2 rounded-xl overflow-hidden transition ${
                              isLahanExpanded
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <button
                              onClick={() => toggleLahan(l.id)}
                              className="w-full text-left p-3 hover:bg-white/50 transition"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-gray-900">
                                    🗺️ {l.nama}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span>📏 {l.luas.toFixed(2)} Ha</span>
                                    <span>📊 {formatKg(l.totalHasilKg)}</span>
                                  </div>
                                  {l.komoditasRingkas.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {l.komoditasRingkas.map((kr) => (
                                        <span
                                          key={kr.komoditas}
                                          className="text-[10px] bg-white border border-gray-200 text-gray-700 rounded-full px-2 py-0.5 font-medium"
                                        >
                                          {KOMODITAS_LABEL[kr.komoditas] ||
                                            kr.komoditas}
                                          : {kr.jml}x{" "}
                                          {kr.isPerMusim ? "musim" : "panen"}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {l.rataProduktivitas > 0 && (
                                    <span className="text-xs font-mono font-bold text-blue-700">
                                      {l.rataProduktivitas.toFixed(0)} Kg/Ha
                                    </span>
                                  )}
                                  <span
                                    className={`text-gray-500 text-lg transition-transform ${
                                      isLahanExpanded ? "rotate-180" : ""
                                    }`}
                                  >
                                    ▼
                                  </span>
                                </div>
                              </div>
                            </button>

                            {isLahanExpanded && (
                              <div className="border-t border-blue-200 bg-white p-3">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                  <div className="text-xs font-bold text-gray-700 uppercase">
                                    📅 Riwayat Panen ({l.jmlPanen})
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <Link
                                      href={`/penggarap/${p.id}/lahan/${l.id}`}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                                    >
                                      🗺️ Detail Lahan
                                    </Link>
                                    <Link
                                      href={`/penggarap/${p.id}/lahan/${l.id}/panen/baru`}
                                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                                    >
                                      + Input Panen
                                    </Link>
                                  </div>
                                </div>

                                {l.riwayatPanen.length === 0 ? (
                                  <div className="text-center py-4 text-gray-400 italic text-xs">
                                    Belum ada riwayat panen
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {tahunKelompok.map((tahunData) => {
                                      const tahunKey = `${p.id}-${l.id}-${tahunData.tahun}`;
                                      const isTahunExpanded =
                                        expandedTahun === tahunKey;
                                      const tr = l.tahunRingkas.find(
                                        (t) => t.tahun === tahunData.tahun
                                      );

                                      return (
                                        <div
                                          key={tahunData.tahun}
                                          className="border-2 border-gray-300 rounded-lg overflow-hidden"
                                        >
                                          <button
                                            onClick={() =>
                                              toggleTahun(tahunKey)
                                            }
                                            className="w-full text-left p-2.5 bg-gray-100 hover:bg-gray-200 transition"
                                          >
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-gray-900">
                                                  📆 {tahunData.tahun}
                                                </span>
                                                {tr && (
                                                  <span className="text-[10px] bg-white border border-gray-300 text-gray-700 rounded-full px-2 py-0.5 font-medium">
                                                    {tr.jmlMusim}x musim ·{" "}
                                                    {tr.jmlPanenRaw}x panen
                                                  </span>
                                                )}
                                              </div>
                                              <span
                                                className={`text-gray-600 text-sm transition-transform ${
                                                  isTahunExpanded
                                                    ? "rotate-180"
                                                    : ""
                                                }`}
                                              >
                                                ▼
                                              </span>
                                            </div>

                                            {tr && (
                                              <div className="flex flex-wrap gap-1 mt-1.5">
                                                {tr.komoditasList.map((kom) => (
                                                  <span
                                                    key={kom}
                                                    className="text-[10px] bg-white border border-gray-300 text-gray-700 rounded-full px-2 py-0.5 font-medium"
                                                  >
                                                    {KOMODITAS_LABEL[kom] ||
                                                      kom}
                                                  </span>
                                                ))}
                                              </div>
                                            )}

                                            {tr && (
                                              <div className="flex items-center justify-between flex-wrap gap-2 mt-1.5 text-[10px]">
                                                <span className="text-gray-600">
                                                  Total:{" "}
                                                  <span className="font-bold text-gray-800">
                                                    {formatKg(
                                                      tr.totalHasilKg
                                                    )}
                                                  </span>
                                                </span>
                                                <div className="flex gap-2 flex-wrap">
                                                  <span className="text-green-700">
                                                    👤{" "}
                                                    <span className="font-bold">
                                                      {formatRp(
                                                        tr.profitOwner
                                                      )}
                                                    </span>
                                                  </span>
                                                  <span className="text-orange-600">
                                                    👨‍🌾{" "}
                                                    <span className="font-bold">
                                                      {formatRp(
                                                        tr.profitPenggarap
                                                      )}
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          </button>

                                          {isTahunExpanded && (
                                            <div className="p-2 space-y-2 bg-white">
                                              {tahunData.items.map(
                                                (item, idx) => {
                                                  if (item.tipe === "musim") {
                                                    const m = item.data;
                                                    const musimKey = `${p.id}-${l.id}-${m.musim}`;
                                                    const isMusimExpanded =
                                                      expandedMusim ===
                                                      musimKey;
                                                    const kat =
                                                      hitungKategoriLokal(
                                                        m.produktivitas,
                                                        "cabai_rawit"
                                                      );
                                                    const lunas =
                                                      m.sisaHutangAkhir <= 0;

                                                    return (
                                                      <div
                                                        key={`musim-${idx}`}
                                                        className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg overflow-hidden"
                                                      >
                                                        <button
                                                          onClick={() =>
                                                            toggleMusim(
                                                              musimKey
                                                            )
                                                          }
                                                          className="w-full text-left p-2.5 hover:bg-orange-100 transition"
                                                        >
                                                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              <span className="text-xs font-bold text-orange-900">
                                                                🌶️ {m.musim}
                                                              </span>
                                                              <span className="text-[10px] bg-white/60 border border-orange-300 text-orange-800 rounded-full px-2 py-0.5 font-bold">
                                                                {m.jmlPanen}x
                                                                panen
                                                              </span>
                                                            </div>
                                                            <span
                                                              className={`text-orange-700 text-sm transition-transform ${
                                                                isMusimExpanded
                                                                  ? "rotate-180"
                                                                  : ""
                                                              }`}
                                                            >
                                                              ▼
                                                            </span>
                                                          </div>

                                                          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              <span className="text-gray-700">
                                                                Total:{" "}
                                                                <span className="font-bold">
                                                                  {formatKg(
                                                                    m.totalHasilKg
                                                                  )}
                                                                </span>
                                                              </span>
                                                              <span className="text-green-700 font-bold font-mono">
                                                                {m.produktivitas.toFixed(
                                                                  0
                                                                )}{" "}
                                                                Kg/Ha
                                                              </span>
                                                            </div>
                                                            {kat && (
                                                              <span
                                                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${kat.color}`}
                                                              >
                                                                {kat.icon}{" "}
                                                                {kat.label}
                                                              </span>
                                                            )}
                                                          </div>

                                                          <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-1.5 pt-1.5 border-t border-orange-200">
                                                            <div className="bg-green-50 border border-green-200 rounded p-1.5 min-w-0 text-center">
                                                              <div className="text-green-800 font-medium text-[9px]">
                                                                👤 Total Owner
                                                              </div>
                                                              <div className="font-bold text-green-900 text-[10px] break-all leading-tight">
                                                                {formatRp(
                                                                  m.totalProfitOwner
                                                                )}
                                                              </div>
                                                            </div>
                                                            <div className="bg-orange-100 border border-orange-300 rounded p-1.5 min-w-0 text-center">
                                                              <div className="text-orange-800 font-medium text-[9px]">
                                                                👨‍🌾 Total
                                                                Penggarap
                                                              </div>
                                                              <div className="font-bold text-orange-900 text-[10px] break-all leading-tight">
                                                                {formatRp(
                                                                  m.totalProfitPenggarap
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <div className="mt-1.5 text-[10px] flex items-center justify-between flex-wrap gap-1">
                                                            <span className="text-gray-600">
                                                              Potong Hutang:{" "}
                                                              <span className="font-bold">
                                                                {formatRp(
                                                                  m.totalPotongan
                                                                )}
                                                              </span>
                                                            </span>
                                                            {lunas ? (
                                                              <span className="bg-green-200 text-green-900 px-2 py-0.5 rounded-full font-bold">
                                                                ✅ LUNAS
                                                              </span>
                                                            ) : (
                                                              <span className="bg-red-200 text-red-900 px-2 py-0.5 rounded-full font-bold">
                                                                ⚠️ Sisa{" "}
                                                                {formatRp(
                                                                  m.sisaHutangAkhir
                                                                )}
                                                              </span>
                                                            )}
                                                          </div>

                                                          {!isMusimExpanded && (
                                                            <div className="text-[10px] text-orange-700 italic mt-1.5 text-center">
                                                              ▼ Klik untuk
                                                              lihat detail{" "}
                                                              {m.jmlPanen} panen
                                                              + Invoice Musim
                                                            </div>
                                                          )}
                                                        </button>

                                                        {isMusimExpanded && (
                                                          <div className="border-t border-orange-300 bg-white p-2 space-y-1.5">
                                                            <div className="flex justify-end mb-1">
                                                              <Link
                                                                href={`/penggarap/${p.id}/lahan/${l.id}/musim/${encodeURIComponent(
                                                                  m.musim
                                                                )}`}
                                                                className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                                                              >
                                                                🧾 Invoice
                                                                Musim ({m.jmlPanen}{" "}
                                                                panen)
                                                              </Link>
                                                            </div>

                                                            {m.panenList.map(
                                                              (h, hIdx) => {
                                                                const prod =
                                                                  l.luas > 0
                                                                    ? h.hasilKg /
                                                                      l.luas
                                                                    : 0;
                                                                const nomorPanen =
                                                                  m.panenList
                                                                    .length -
                                                                  hIdx;
                                                                const potongan =
                                                                  h.potonganHutang ||
                                                                  0;

                                                                return (
                                                                  <div
                                                                    key={h.id}
                                                                    className="bg-orange-50 border border-orange-200 rounded-lg p-2"
                                                                  >
                                                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                                                      <span className="text-[10px] font-bold text-orange-900">
                                                                        Panen
                                                                        ke-
                                                                        {
                                                                          nomorPanen
                                                                        }
                                                                      </span>
                                                                      <span className="text-[10px] text-gray-600">
                                                                        {formatTanggal(
                                                                          h.tanggal
                                                                        )}
                                                                      </span>
                                                                    </div>

                                                                    <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-1.5">
                                                                      <div>
                                                                        <div className="text-gray-500">
                                                                          Hasil
                                                                        </div>
                                                                        <div className="font-bold text-gray-800">
                                                                          {h.hasilKg.toLocaleString(
                                                                            "id-ID"
                                                                          )}{" "}
                                                                          Kg
                                                                        </div>
                                                                      </div>
                                                                      <div>
                                                                        <div className="text-gray-500">
                                                                          Produktivitas
                                                                        </div>
                                                                        <div className="font-bold text-green-700 font-mono">
                                                                          {prod.toFixed(
                                                                            0
                                                                          )}{" "}
                                                                          Kg/Ha
                                                                        </div>
                                                                      </div>
                                                                      <div>
                                                                        <div className="text-gray-500">
                                                                          Profit
                                                                          Bersih
                                                                        </div>
                                                                        <div className="font-bold text-blue-700 break-all">
                                                                          {formatRp(
                                                                            h.profitBersih
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    </div>

                                                                    <BagiHasilBox
                                                                      profitBersih={
                                                                        h.profitBersih
                                                                      }
                                                                      profitOwnerFinal={
                                                                        h.profitOwner
                                                                      }
                                                                      profitPenggarapFinal={
                                                                        h.profitPenggarap
                                                                      }
                                                                      potonganHutang={
                                                                        potongan
                                                                      }
                                                                      sisaHutangSesudah={
                                                                        h.sisaHutangSesudah
                                                                      }
                                                                      persenOwner={
                                                                        h.persenOwner ||
                                                                        50
                                                                      }
                                                                      persenPenggarap={
                                                                        h.persenPenggarap ||
                                                                        50
                                                                      }
                                                                    />

                                                                    <div className="flex flex-wrap gap-1.5 pt-1.5 mt-1.5 border-t border-orange-200">
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-2 py-1 rounded transition"
                                                                      >
                                                                        🔍
                                                                        Detail
                                                                      </Link>
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}/edit`}
                                                                        className="text-[10px] bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium px-2 py-1 rounded transition"
                                                                      >
                                                                        ✏️
                                                                        Edit
                                                                      </Link>
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                                        className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-medium px-2 py-1 rounded transition"
                                                                      >
                                                                        🧾
                                                                        Invoice
                                                                      </Link>
                                                                    </div>
                                                                  </div>
                                                                );
                                                              }
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  }

                                                  const h = item.data;
                                                  const prod =
                                                    l.luas > 0
                                                      ? h.hasilKg / l.luas
                                                      : 0;
                                                  const katP =
                                                    hitungKategoriLokal(
                                                      prod,
                                                      h.komoditas
                                                    );
                                                  const potongan =
                                                    h.potonganHutang || 0;

                                                  return (
                                                    <div
                                                      key={h.id}
                                                      className="bg-gray-50 border border-gray-200 rounded-lg p-2.5"
                                                    >
                                                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                                            {KOMODITAS_LABEL[
                                                              h.komoditas
                                                            ] || h.komoditas}
                                                          </span>
                                                          <span className="text-[10px] text-gray-500">
                                                            {formatTanggal(
                                                              h.tanggal
                                                            )}
                                                          </span>
                                                          {katP && (
                                                            <span
                                                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${katP.color}`}
                                                            >
                                                              {katP.icon}{" "}
                                                              {katP.label}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-2 pb-2 border-b border-gray-200">
                                                        <div>
                                                          <div className="text-gray-500">
                                                            Hasil Panen
                                                          </div>
                                                          <div className="font-bold text-gray-800">
                                                            {h.hasilKg.toLocaleString(
                                                              "id-ID"
                                                            )}{" "}
                                                            Kg
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <div className="text-gray-500">
                                                            Produktivitas
                                                          </div>
                                                          <div className="font-bold text-green-700 font-mono">
                                                            {prod.toFixed(0)}{" "}
                                                            Kg/Ha
                                                          </div>
                                                        </div>
                                                        <div className="text-right">
                                                          <div className="text-gray-500">
                                                            💵 Profit Bersih
                                                          </div>
                                                          <div className="font-bold text-blue-700 break-all">
                                                            {formatRp(
                                                              h.profitBersih
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      <BagiHasilBox
                                                        profitBersih={
                                                          h.profitBersih
                                                        }
                                                        profitOwnerFinal={
                                                          h.profitOwner
                                                        }
                                                        profitPenggarapFinal={
                                                          h.profitPenggarap
                                                        }
                                                        potonganHutang={
                                                          potongan
                                                        }
                                                        sisaHutangSesudah={
                                                          h.sisaHutangSesudah
                                                        }
                                                        persenOwner={
                                                          h.persenOwner || 50
                                                        }
                                                        persenPenggarap={
                                                          h.persenPenggarap ||
                                                          50
                                                        }
                                                      />

                                                      <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-gray-200">
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                          className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-2 py-1 rounded transition"
                                                        >
                                                          🔍 Detail
                                                        </Link>
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}/edit`}
                                                          className="text-[10px] bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium px-2 py-1 rounded transition"
                                                        >
                                                          ✏️ Edit
                                                        </Link>
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                          className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-medium px-2 py-1 rounded transition"
                                                        >
                                                          🧾 Invoice
                                                        </Link>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={`/penggarap/${p.id}`}
                    className="flex-1 min-w-[120px] bg-green-700 hover:bg-green-800 text-white text-sm font-bold text-center py-2.5 rounded-lg transition"
                  >
                    📋 Detail Lengkap
                  </Link>
                  <Link
                    href={`/penggarap/${p.id}/lahan/baru`}
                    className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold text-center py-2.5 rounded-lg transition"
                  >
                    + Tambah Lahan
                  </Link>
                  <Link
                    href={`/penggarap/${p.id}/hutang/baru`}
                    className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold text-center py-2.5 rounded-lg transition"
                  >
                    💰 Tambah Hutang
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
