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

type ProduktivitasKomoditas = {
  komoditas: string;
  produktivitasRata: number;
  jmlPanen: number;
  totalHasilKg: number;
  kategori: { label: string; icon: string; color: string } | null;
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
  produktivitas: ProduktivitasKomoditas[];
  lahanList: LahanItem[];
};

type Props = {
  penggarapLengkap: PenggarapLengkap[];
};

export function PenggarapKlien({ penggarapLengkap }: Props) {
  const [expandedPenggarap, setExpandedPenggarap] = useState<string | null>(
    null
  );
  const [expandedLahan, setExpandedLahan] = useState<string | null>(null);

  function togglePenggarap(id: string) {
    if (expandedPenggarap === id) {
      setExpandedPenggarap(null);
      setExpandedLahan(null);
    } else {
      setExpandedPenggarap(id);
      setExpandedLahan(null);
    }
  }

  function toggleLahan(id: string) {
    if (expandedLahan === id) {
      setExpandedLahan(null);
    } else {
      setExpandedLahan(id);
    }
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
            {/* HEADER PENGGARAP */}
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

              {/* Badge Kategori per Komoditas (collapsed) */}
              {!isExpanded && p.produktivitas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  {p.produktivitas.slice(0, 3).map((pk) => (
                    <div
                      key={pk.komoditas}
                      className="flex items-center justify-between flex-wrap gap-2 text-xs"
                    >
                      <span className="font-medium text-gray-700">
                        {KOMODITAS_LABEL[pk.komoditas] || pk.komoditas}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-mono">
                          {pk.produktivitasRata.toFixed(0)} Kg/Ha
                        </span>
                        {pk.kategori ? (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              backgroundColor: pk.kategori.color + "20",
                              color: pk.kategori.color,
                            }}
                          >
                            {pk.kategori.icon} {pk.kategori.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            (belum ada kategori)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {p.produktivitas.length > 3 && (
                    <div className="text-[10px] text-gray-400 italic">
                      +{p.produktivitas.length - 3} komoditas lain
                    </div>
                  )}
                </div>
              )}
            </button>

            {/* DROPDOWN DETAIL */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {/* Produktivitas per Komoditas */}
                {p.produktivitas.length > 0 && (
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-xs font-bold text-gray-700 uppercase mb-2">
                      📊 Produktivitas per Komoditas
                    </div>
                    <div className="space-y-1.5">
                      {p.produktivitas.map((pk) => (
                        <div
                          key={pk.komoditas}
                          className="flex items-center justify-between flex-wrap gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="font-medium text-gray-800">
                            {KOMODITAS_LABEL[pk.komoditas] || pk.komoditas}
                          </span>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-gray-500">
                              {pk.jmlPanen}x · {formatKg(pk.totalHasilKg)}
                            </span>
                            <span className="font-bold text-gray-800 font-mono">
                              {pk.produktivitasRata.toFixed(0)} Kg/Ha
                            </span>
                            {pk.kategori && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{
                                  backgroundColor: pk.kategori.color + "20",
                                  color: pk.kategori.color,
                                }}
                              >
                                {pk.kategori.icon} {pk.kategori.label}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daftar Lahan */}
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
                                  <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3">
                                    <span>📏 {l.luas.toFixed(2)} Ha</span>
                                    <span>🌾 {l.jmlPanen}x panen</span>
                                    <span>📊 {formatKg(l.totalHasilKg)}</span>
                                  </div>
                                  {l.komoditasList.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {l.komoditasList.map((kom) => (
                                        <span
                                          key={kom}
                                          className="text-[10px] bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium"
                                        >
                                          {KOMODITAS_LABEL[kom] || kom}
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

                            {/* Sub-Dropdown: Riwayat Panen */}
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
                                    {l.riwayatPanen.map((h) => (
                                      <div
                                        key={h.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-2.5"
                                      >
                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                              {KOMODITAS_LABEL[h.komoditas] ||
                                                h.komoditas}
                                            </span>
                                            {h.musim && (
                                              <span className="text-[10px] bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 font-bold">
                                                🗓️ {h.musim}
                                              </span>
                                            )}
                                            <span className="text-[10px] text-gray-500">
                                              {formatTanggal(h.tanggal)}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Row 1: Hasil + Profit Bersih */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 pb-2 border-b border-gray-200">
                                          <div>
                                            <div className="text-gray-500">
                                              Hasil Panen
                                            </div>
                                            <div className="font-bold text-gray-800">
                                              {h.hasilKg.toLocaleString("id-ID")} Kg
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-gray-500">
                                              💵 Profit Bersih
                                            </div>
                                            <div className="font-bold text-blue-700 break-words">
                                              {formatRp(h.profitBersih)}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Row 2: Owner + Penggarap */}
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-2 min-w-0">
                                            <div className="text-green-800 font-medium">
                                              👤 Owner
                                              {h.persenOwner !== undefined && (
                                                <span className="text-[9px] text-green-600 ml-1">
                                                  ({h.persenOwner}%)
                                                </span>
                                              )}
                                            </div>
                                            <div className="font-bold text-green-900 mt-0.5 break-words leading-tight">
                                              {formatRp(h.profitOwner)}
                                            </div>
                                          </div>
                                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 min-w-0">
                                            <div className="text-orange-800 font-medium">
                                              👨‍🌾 Penggarap
                                              {h.persenPenggarap !==
                                                undefined && (
                                                <span className="text-[9px] text-orange-600 ml-1">
                                                  ({h.persenPenggarap}%)
                                                </span>
                                              )}
                                            </div>
                                            <div className="font-bold text-orange-900 mt-0.5 break-words leading-tight">
                                              {formatRp(h.profitPenggarap)}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Tombol Aksi */}
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
                                    ))}
                                    {l.jmlPanen > 10 && (
                                      <div className="text-center text-[10px] text-gray-500 italic pt-1">
                                        Menampilkan 10 panen terbaru dari{" "}
                                        {l.jmlPanen} total
                                      </div>
                                    )}
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

                {/* Tombol Aksi Penggarap */}
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
