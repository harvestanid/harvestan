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
    return { icon: "⭐⭐⭐", label: "SANGAT BAIK", color: "text-[#2c5e2e] bg-[#2c5e2e]/10 border-[#2c5e2e]/30" };
  if (prod >= k.baik)
    return { icon: "⭐⭐", label: "BAIK", color: "text-blue-800 bg-blue-100 border-blue-300" };
  if (prod >= k.cukup)
    return { icon: "⭐", label: "CUKUP", color: "text-[#2c5e2e] bg-[#f0b429]/15 border-[#f0b429]/40" };
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1.5">
            Bagi Hasil Dasar ({persenOwner}:{persenPenggarap})
          </div>
          <div className="text-[10px] text-blue-600 mb-2">
            Profit Bersih:{" "}
            <span className="font-bold">{formatRp(profitBersih)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border-2 border-[#2c5e2e]/30 rounded-xl p-2 text-center min-w-0">
              <div className="text-[10px] text-[#2c5e2e] font-bold">
                👤 Owner ({persenOwner}%)
              </div>
              <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
                {formatRp(profitOwnerMurni)}
              </div>
            </div>
            <div className="bg-white border-2 border-[#f0b429]/50 rounded-xl p-2 text-center min-w-0">
              <div className="text-[10px] text-[#2c5e2e] font-bold">
                👨‍🌾 Penggarap ({persenPenggarap}%)
              </div>
              <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
                {formatRp(profitPenggarapMurni)}
              </div>
            </div>
          </div>
        </div>

        {/* TAHAP 2: SETELAH POTONG HUTANG */}
        {adaPotongan && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1.5">
              Setelah Potong Hutang
            </div>
            <div className="text-[10px] text-red-700 mb-2 flex items-center justify-between flex-wrap gap-1">
              <span>
                💸 Potong:{" "}
                <span className="font-bold">
                  − {formatRp(potonganHutang)}
                </span>
              </span>
              {lunas ? (
                <span className="bg-[#2c5e2e] text-white px-2 py-0.5 rounded-full font-bold text-[9px]">
                  🎉 LUNAS
                </span>
              ) : (
                <span className="bg-[#f0b429] text-[#2c5e2e] px-2 py-0.5 rounded-full font-bold text-[9px]">
                  Sisa: {formatRp(sisaHutangSesudah)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border-2 border-[#2c5e2e] rounded-xl p-2 text-center min-w-0">
                <div className="text-[10px] text-[#2c5e2e] font-bold">
                  👤 Owner
                </div>
                <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
                  {formatRp(profitOwnerFinal)}
                </div>
              </div>
              <div className="bg-white border-2 border-[#f0b429] rounded-xl p-2 text-center min-w-0">
                <div className="text-[10px] text-[#2c5e2e] font-bold">
                  👨‍🌾 Penggarap
                </div>
                <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
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
        const penggarapHeaderMuted = isExpanded && expandedLahan !== null;

        return (
          <div
            key={p.id}
            className={`rounded-3xl overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "bg-gradient-to-br from-[#f0b429]/10 to-white border-2 border-[#f0b429]/50 shadow-2xl shadow-[#f0b429]/20 ring-4 ring-[#f0b429]/10"
                : "bg-white border-2 border-[#2c5e2e]/8 hover:border-[#2c5e2e]/20 hover:shadow-lg shadow-[#2c5e2e]/5"
            }`}
          >
            <button
              onClick={() => togglePenggarap(p.id)}
              className={`w-full text-left p-4 md:p-5 transition-all duration-300 ${
                isExpanded ? "hover:bg-[#f0b429]/5" : "hover:bg-[#faf9f5]"
              } ${penggarapHeaderMuted ? "opacity-40" : "opacity-100"}`}
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-bold text-lg text-[#2c5e2e] tracking-tight">
                      👨‍🌾 {p.nama}
                    </span>
                    {isExpanded && (
                      <span className="text-[9px] bg-[#f0b429] text-[#2c5e2e] rounded-full px-2.5 py-0.5 font-bold uppercase tracking-widest">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#2c5e2e]/60 flex flex-wrap gap-x-3 gap-y-0.5">
                    {p.kontak && <span>📞 {p.kontak}</span>}
                    {p.alamat && <span>📍 {p.alamat}</span>}
                  </div>
                  <div className="text-xs text-[#2c5e2e] mt-2 font-semibold flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>🗺️ {p.totalLahan} lahan</span>
                    <span>📏 {p.totalLuas.toFixed(2)} Ha</span>
                    <span>🌾 {p.jmlPanen}x panen</span>
                  </div>
                  {p.komoditasDitanam.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {p.komoditasDitanam.map((kom) => (
                        <span
                          key={kom}
                          className="text-[10px] bg-[#2c5e2e]/8 border border-[#2c5e2e]/20 text-[#2c5e2e] rounded-full px-2.5 py-0.5 font-bold"
                        >
                          {KOMODITAS_LABEL[kom] || kom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xl transition-transform ${
                      isExpanded ? "rotate-180 text-[#f0b429]" : "text-[#2c5e2e]/40"
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t-2 border-[#f0b429]/30 bg-[#faf9f5] p-4 space-y-4">
                <div className="bg-white rounded-3xl p-4 border border-[#2c5e2e]/8">
                  <div className="text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-3">
                    🗺️ Daftar Lahan ({p.lahanList.length})
                  </div>
                  {p.lahanList.length === 0 ? (
                    <div className="text-center py-6 text-[#2c5e2e]/40 italic text-sm">
                      Belum ada lahan
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {p.lahanList.map((l) => {
                        const isLahanExpanded = expandedLahan === l.id;
                        const lahanHeaderMuted =
                          isLahanExpanded && expandedTahun !== null;
                        const tahunKelompok = isLahanExpanded
                          ? kelompokkanPerTahun(l.riwayatPanen, l.luas)
                          : [];

                        return (
                          <div
                            key={l.id}
                            className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                              isLahanExpanded
                                ? "bg-gradient-to-br from-blue-50 to-white border-2 border-blue-400 ring-4 ring-blue-100"
                                : "bg-[#faf9f5] border-2 border-[#2c5e2e]/8 hover:border-[#2c5e2e]/20"
                            }`}
                          >
                            <button
                              onClick={() => toggleLahan(l.id)}
                              className={`w-full text-left p-3.5 transition-all duration-300 ${
                                isLahanExpanded
                                  ? "hover:bg-blue-50"
                                  : "hover:bg-white"
                              } ${lahanHeaderMuted ? "opacity-40" : "opacity-100"}`}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm text-[#2c5e2e] flex items-center gap-2 flex-wrap">
                                    🗺️ {l.nama}
                                    {isLahanExpanded && (
                                      <span className="text-[9px] bg-blue-500 text-white rounded-full px-2.5 py-0.5 font-bold uppercase tracking-widest">
                                        Aktif
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#2c5e2e]/60 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span>📏 {l.luas.toFixed(2)} Ha</span>
                                    <span>📊 {formatKg(l.totalHasilKg)}</span>
                                  </div>
                                  {l.komoditasRingkas.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {l.komoditasRingkas.map((kr) => (
                                        <span
                                          key={kr.komoditas}
                                          className="text-[10px] bg-white border border-[#2c5e2e]/15 text-[#2c5e2e] rounded-full px-2 py-0.5 font-medium"
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
                                    className={`text-lg transition-transform ${
                                      isLahanExpanded
                                        ? "rotate-180 text-blue-600"
                                        : "text-[#2c5e2e]/40"
                                    }`}
                                  >
                                    ▼
                                  </span>
                                </div>
                              </div>
                            </button>

                            {isLahanExpanded && (
                              <div className="border-t-2 border-blue-200 bg-blue-50/30 p-3.5">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                  <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">
                                    📅 Riwayat Panen ({l.jmlPanen})
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <Link
                                      href={`/penggarap/${p.id}/lahan/${l.id}`}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                                    >
                                      🗺️ Detail Lahan
                                    </Link>
                                    <Link
                                      href={`/penggarap/${p.id}/lahan/${l.id}/panen/baru`}
                                      className="text-xs bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                                    >
                                      + Input Panen
                                    </Link>
                                  </div>
                                </div>

                                {l.riwayatPanen.length === 0 ? (
                                  <div className="text-center py-6 text-[#2c5e2e]/40 italic text-xs">
                                    Belum ada riwayat panen
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {tahunKelompok.map((tahunData) => {
                                      const tahunKey = `${p.id}-${l.id}-${tahunData.tahun}`;
                                      const isTahunExpanded =
                                        expandedTahun === tahunKey;
                                      const tahunHeaderMuted =
                                        isTahunExpanded &&
                                        expandedMusim !== null;
                                      const tr = l.tahunRingkas.find(
                                        (t) => t.tahun === tahunData.tahun
                                      );

                                      return (
                                        <div
                                          key={tahunData.tahun}
                                          className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                                            isTahunExpanded
                                              ? "bg-gradient-to-br from-purple-50 to-white border-2 border-purple-400 ring-4 ring-purple-100"
                                              : "bg-white border-2 border-[#2c5e2e]/8 hover:border-[#2c5e2e]/20"
                                          }`}
                                        >
                                          <button
                                            onClick={() =>
                                              toggleTahun(tahunKey)
                                            }
                                            className={`w-full text-left p-3 transition-all duration-300 ${
                                              isTahunExpanded
                                                ? "hover:bg-purple-50"
                                                : "hover:bg-[#faf9f5]"
                                            } ${tahunHeaderMuted ? "opacity-40" : "opacity-100"}`}
                                          >
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-[#2c5e2e] tracking-tight">
                                                  📆 {tahunData.tahun}
                                                </span>
                                                {isTahunExpanded && (
                                                  <span className="text-[9px] bg-purple-500 text-white rounded-full px-2.5 py-0.5 font-bold uppercase tracking-widest">
                                                    Aktif
                                                  </span>
                                                )}
                                                {tr && (
                                                  <span className="text-[10px] bg-[#faf9f5] border border-[#2c5e2e]/15 text-[#2c5e2e] rounded-full px-2.5 py-0.5 font-bold">
                                                    {tr.jmlMusim}x musim ·{" "}
                                                    {tr.jmlPanenRaw}x panen
                                                  </span>
                                                )}
                                              </div>
                                              <span
                                                className={`text-sm transition-transform ${
                                                  isTahunExpanded
                                                    ? "rotate-180 text-purple-600"
                                                    : "text-[#2c5e2e]/40"
                                                }`}
                                              >
                                                ▼
                                              </span>
                                            </div>

                                            {tr && (
                                              <div className="flex flex-wrap gap-1.5 mt-2">
                                                {tr.komoditasList.map((kom) => (
                                                  <span
                                                    key={kom}
                                                    className="text-[10px] bg-[#faf9f5] border border-[#2c5e2e]/15 text-[#2c5e2e] rounded-full px-2 py-0.5 font-medium"
                                                  >
                                                    {KOMODITAS_LABEL[kom] ||
                                                      kom}
                                                  </span>
                                                ))}
                                              </div>
                                            )}

                                            {tr && (
                                              <div className="flex items-center justify-between flex-wrap gap-2 mt-2 text-[10px]">
                                                <span className="text-[#2c5e2e]/60">
                                                  Total:{" "}
                                                  <span className="font-bold text-[#2c5e2e]">
                                                    {formatKg(
                                                      tr.totalHasilKg
                                                    )}
                                                  </span>
                                                </span>
                                                <div className="flex gap-2 flex-wrap">
                                                  <span className="text-[#2c5e2e]">
                                                    👤{" "}
                                                    <span className="font-bold">
                                                      {formatRp(
                                                        tr.profitOwner
                                                      )}
                                                    </span>
                                                  </span>
                                                  <span className="text-[#f0b429]">
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
                                            <div className="p-2 space-y-2 bg-purple-50/30">
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
                                                        className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                                                          isMusimExpanded
                                                            ? "bg-gradient-to-br from-[#f0b429]/15 to-orange-50 border-2 border-[#f0b429] ring-4 ring-[#f0b429]/20"
                                                            : "bg-gradient-to-br from-[#f0b429]/8 to-orange-50/50 border-2 border-[#f0b429]/40 hover:border-[#f0b429]"
                                                        }`}
                                                      >
                                                        <button
                                                          onClick={() =>
                                                            toggleMusim(
                                                              musimKey
                                                            )
                                                          }
                                                          className="w-full text-left p-3 hover:bg-[#f0b429]/10 transition"
                                                        >
                                                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              <span className="text-xs font-bold text-[#2c5e2e]">
                                                                🌶️ {m.musim}
                                                              </span>
                                                              <span className="text-[10px] bg-white/70 border border-[#f0b429]/60 text-[#2c5e2e] rounded-full px-2 py-0.5 font-bold">
                                                                {m.jmlPanen}x
                                                                panen
                                                              </span>
                                                              {isMusimExpanded && (
                                                                <span className="text-[9px] bg-[#f0b429] text-[#2c5e2e] rounded-full px-2.5 py-0.5 font-bold uppercase tracking-widest">
                                                                  Aktif
                                                                </span>
                                                              )}
                                                            </div>
                                                            <span
                                                              className={`text-sm transition-transform ${
                                                                isMusimExpanded
                                                                  ? "rotate-180 text-[#2c5e2e]"
                                                                  : "text-[#2c5e2e]/60"
                                                              }`}
                                                            >
                                                              ▼
                                                            </span>
                                                          </div>

                                                          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              <span className="text-[#2c5e2e]/80">
                                                                Total:{" "}
                                                                <span className="font-bold text-[#2c5e2e]">
                                                                  {formatKg(
                                                                    m.totalHasilKg
                                                                  )}
                                                                </span>
                                                              </span>
                                                              <span className="text-[#2c5e2e] font-bold font-mono">
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

                                                          <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 pt-2 border-t border-[#f0b429]/30">
                                                            <div className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/20 rounded-xl p-2 min-w-0 text-center">
                                                              <div className="text-[#2c5e2e] font-bold text-[9px]">
                                                                👤 Total Owner
                                                              </div>
                                                              <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
                                                                {formatRp(
                                                                  m.totalProfitOwner
                                                                )}
                                                              </div>
                                                            </div>
                                                            <div className="bg-[#f0b429]/15 border border-[#f0b429]/40 rounded-xl p-2 min-w-0 text-center">
                                                              <div className="text-[#2c5e2e] font-bold text-[9px]">
                                                                👨‍🌾 Total
                                                                Penggarap
                                                              </div>
                                                              <div className="font-bold text-[#2c5e2e] text-[11px] break-all leading-tight mt-1">
                                                                {formatRp(
                                                                  m.totalProfitPenggarap
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <div className="mt-2 text-[10px] flex items-center justify-between flex-wrap gap-1">
                                                            <span className="text-[#2c5e2e]/70">
                                                              Potong Hutang:{" "}
                                                              <span className="font-bold">
                                                                {formatRp(
                                                                  m.totalPotongan
                                                                )}
                                                              </span>
                                                            </span>
                                                            {lunas ? (
                                                              <span className="bg-[#2c5e2e] text-white px-2 py-0.5 rounded-full font-bold">
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
                                                            <div className="text-[10px] text-[#2c5e2e]/70 italic mt-2 text-center">
                                                              ▼ Klik untuk
                                                              lihat detail{" "}
                                                              {m.jmlPanen} panen
                                                              + Invoice Musim
                                                            </div>
                                                          )}
                                                        </button>

                                                        {isMusimExpanded && (
                                                          <div className="border-t-2 border-[#f0b429]/40 bg-white/50 p-2 space-y-2">
                                                            <div className="flex justify-end mb-1">
                                                              <Link
                                                                href={`/penggarap/${p.id}/lahan/${l.id}/musim/${encodeURIComponent(
                                                                  m.musim
                                                                )}`}
                                                                className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
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
                                                                    className="bg-white border-2 border-[#2c5e2e]/15 rounded-2xl p-2.5"
                                                                  >
                                                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                                                      <span className="text-[10px] font-bold text-[#2c5e2e]">
                                                                        🌾 Panen
                                                                        ke-
                                                                        {
                                                                          nomorPanen
                                                                        }
                                                                      </span>
                                                                      <span className="text-[10px] text-[#2c5e2e]/60">
                                                                        {formatTanggal(
                                                                          h.tanggal
                                                                        )}
                                                                      </span>
                                                                    </div>

                                                                    <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                                                                      <div>
                                                                        <div className="text-[#2c5e2e]/60">
                                                                          Hasil
                                                                        </div>
                                                                        <div className="font-bold text-[#2c5e2e]">
                                                                          {h.hasilKg.toLocaleString(
                                                                            "id-ID"
                                                                          )}{" "}
                                                                          Kg
                                                                        </div>
                                                                      </div>
                                                                      <div>
                                                                        <div className="text-[#2c5e2e]/60">
                                                                          Produktivitas
                                                                        </div>
                                                                        <div className="font-bold text-[#2c5e2e] font-mono">
                                                                          {prod.toFixed(
                                                                            0
                                                                          )}{" "}
                                                                          Kg/Ha
                                                                        </div>
                                                                      </div>
                                                                      <div>
                                                                        <div className="text-[#2c5e2e]/60">
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

                                                                    <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-[#2c5e2e]/10">
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                                        className="text-[10px] bg-[#faf9f5] hover:bg-[#2c5e2e]/10 text-[#2c5e2e] font-bold px-2.5 py-1 rounded-full transition"
                                                                      >
                                                                        🔍
                                                                        Detail
                                                                      </Link>
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}/edit`}
                                                                        className="text-[10px] bg-[#f0b429]/20 hover:bg-[#f0b429]/30 text-[#2c5e2e] font-bold px-2.5 py-1 rounded-full transition"
                                                                      >
                                                                        ✏️
                                                                        Edit
                                                                      </Link>
                                                                      <Link
                                                                        href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                                        className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-full transition"
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
                                                      className="bg-gradient-to-br from-[#2c5e2e]/5 to-white border-2 border-[#2c5e2e]/15 rounded-2xl p-3"
                                                    >
                                                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="text-[10px] font-bold text-[#2c5e2e] bg-white border border-[#2c5e2e]/20 rounded-full px-2.5 py-0.5">
                                                            {KOMODITAS_LABEL[
                                                              h.komoditas
                                                            ] || h.komoditas}
                                                          </span>
                                                          <span className="text-[10px] text-[#2c5e2e]/60">
                                                            {formatTanggal(
                                                              h.tanggal
                                                            )}
                                                          </span>
                                                          {katP && (
                                                            <span
                                                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${katP.color}`}
                                                            >
                                                              {katP.icon}{" "}
                                                              {katP.label}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-3 gap-2 text-[10px] mb-2 pb-2 border-b border-[#2c5e2e]/10">
                                                        <div>
                                                          <div className="text-[#2c5e2e]/60">
                                                            Hasil Panen
                                                          </div>
                                                          <div className="font-bold text-[#2c5e2e]">
                                                            {h.hasilKg.toLocaleString(
                                                              "id-ID"
                                                            )}{" "}
                                                            Kg
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <div className="text-[#2c5e2e]/60">
                                                            Produktivitas
                                                          </div>
                                                          <div className="font-bold text-[#2c5e2e] font-mono">
                                                            {prod.toFixed(0)}{" "}
                                                            Kg/Ha
                                                          </div>
                                                        </div>
                                                        <div className="text-right">
                                                          <div className="text-[#2c5e2e]/60">
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

                                                      <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-[#2c5e2e]/10">
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                          className="text-[10px] bg-[#faf9f5] hover:bg-[#2c5e2e]/10 text-[#2c5e2e] font-bold px-2.5 py-1 rounded-full transition"
                                                        >
                                                          🔍 Detail
                                                        </Link>
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}/edit`}
                                                          className="text-[10px] bg-[#f0b429]/20 hover:bg-[#f0b429]/30 text-[#2c5e2e] font-bold px-2.5 py-1 rounded-full transition"
                                                        >
                                                          ✏️ Edit
                                                        </Link>
                                                        <Link
                                                          href={`/penggarap/${p.id}/lahan/${l.id}/panen/${h.id}`}
                                                          className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-full transition"
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
                    className="flex-1 min-w-[120px] bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-sm font-bold text-center py-3 rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-[#2c5e2e]/20"
                  >
                    📋 Detail Lengkap
                  </Link>
                  <Link
                    href={`/penggarap/${p.id}/lahan/baru`}
                    className="flex-1 min-w-[120px] bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] text-sm font-bold text-center py-3 rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-[#f0b429]/20"
                  >
                    + Tambah Lahan
                  </Link>
                  <Link
                    href={`/penggarap/${p.id}/hutang/baru`}
                    className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold text-center py-3 rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-purple-600/20"
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
