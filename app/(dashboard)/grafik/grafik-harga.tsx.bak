"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  siapkanDataHargaPerBulan,
  hitungInsightHarga,
  KOMODITAS_COLOR,
  KOMODITAS_LABEL,
  type HarvestRaw,
  type LandRaw,
  type PenggarapRaw,
} from "@/lib/utils/grafik-helpers";

type Props = {
  penggaraps: PenggarapRaw[];
  lands: LandRaw[];
  harvests: HarvestRaw[];
};

const TICK = { fontSize: 11, fill: "#2c5e2e" };
const GRID = "rgba(44, 94, 46, 0.08)";

function formatRpRingkas(n: number): string {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + " jt";
  if (n >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " rb";
  return "Rp " + n.toLocaleString("id-ID");
}

function formatRpFull(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  try {
    return new Date(t).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return t;
  }
}

export function GrafikHarga({ penggaraps, lands, harvests }: Props) {
  const [filterPenggarap, setFilterPenggarap] = useState<string>("");
  const [komoditasAktif, setKomoditasAktif] = useState<Set<string>>(new Set());

  const dataHarga = useMemo(
    () => siapkanDataHargaPerBulan(harvests, lands, filterPenggarap || null),
    [harvests, lands, filterPenggarap]
  );

  const komoditasTersedia = useMemo(
    () => Object.keys(dataHarga).sort(),
    [dataHarga]
  );

  // Auto-select semua saat pertama kali atau saat data berubah
  const komoditasTerpilih = useMemo(() => {
    if (komoditasAktif.size === 0 && komoditasTersedia.length > 0) {
      return new Set(komoditasTersedia);
    }
    // Filter hanya yang tersedia
    const valid = new Set<string>();
    komoditasAktif.forEach((k) => {
      if (komoditasTersedia.includes(k)) valid.add(k);
    });
    return valid;
  }, [komoditasAktif, komoditasTersedia]);

  function toggleKomoditas(kom: string) {
    const next = new Set(komoditasTerpilih);
    if (next.has(kom)) {
      next.delete(kom);
    } else {
      next.add(kom);
    }
    setKomoditasAktif(next);
  }

  function pilihSemua() {
    setKomoditasAktif(new Set(komoditasTersedia));
  }

  function hapusSemua() {
    setKomoditasAktif(new Set());
  }

  // ===== Gabungin semua titik jadi 1 array dengan properti dinamis per komoditas =====
  const chartData = useMemo(() => {
    const timeMap = new Map<number, Record<string, any>>();

    komoditasTerpilih.forEach((kom) => {
      (dataHarga[kom] || []).forEach((d) => {
        if (!timeMap.has(d.timestamp)) {
          timeMap.set(d.timestamp, {
            timestamp: d.timestamp,
            tanggalLabel: formatTanggal(d.tanggal),
          });
        }
        const entry = timeMap.get(d.timestamp)!;
        entry[kom] = d.harga;
      });
    });

    return Array.from(timeMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [dataHarga, komoditasTerpilih]);

  // ===== Insight per komoditas terpilih =====
  const insightPerKomoditas = useMemo(() => {
    return Array.from(komoditasTerpilih).map((kom) => ({
      komoditas: kom,
      insight: hitungInsightHarga(dataHarga[kom] || []),
    }));
  }, [dataHarga, komoditasTerpilih]);

  const adaData = komoditasTersedia.length > 0;

  if (!adaData) {
    return (
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-12 text-center shadow-lg shadow-[#2c5e2e]/5">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="font-bold text-[#2c5e2e] mb-2">
          Belum ada data harga
        </h3>
        <p className="text-[#2c5e2e]/60 text-sm">
          Tambahkan data panen dengan harga jual dulu untuk melihat grafik
          harga.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== INSIGHT CARDS ===== */}
      {insightPerKomoditas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insightPerKomoditas.map(({ komoditas: kom, insight }) => {
            const warna = KOMODITAS_COLOR[kom] || "#666";
            const label = KOMODITAS_LABEL[kom] || kom;
            const tren = insight.trenArah;
            return (
              <div
                key={kom}
                className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-lg shadow-[#2c5e2e]/5"
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: warna }}
                    />
                    <span className="font-bold text-[#2c5e2e] text-sm">
                      {label}
                    </span>
                  </div>
                  {tren === "naik" && (
                    <span className="text-[10px] bg-green-100 border border-green-300 text-green-800 rounded-full px-2 py-0.5 font-bold uppercase tracking-widest">
                      📈 Naik {insight.trenPersen.toFixed(1)}%
                    </span>
                  )}
                  {tren === "turun" && (
                    <span className="text-[10px] bg-red-100 border border-red-300 text-red-800 rounded-full px-2 py-0.5 font-bold uppercase tracking-widest">
                      📉 Turun {Math.abs(insight.trenPersen).toFixed(1)}%
                    </span>
                  )}
                  {tren === "stabil" && (
                    <span className="text-[10px] bg-gray-100 border border-gray-300 text-gray-700 rounded-full px-2 py-0.5 font-bold uppercase tracking-widest">
                      ➡️ Stabil
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/15 rounded-xl p-2 text-center min-w-0">
                    <div className="text-[9px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest">
                      Rata-rata
                    </div>
                    <div className="font-bold text-[#2c5e2e] text-[11px] mt-1 break-all leading-tight">
                      {formatRpRingkas(insight.rataRata)}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center min-w-0">
                    <div className="text-[9px] text-green-700 font-bold uppercase tracking-widest">
                      Tertinggi
                    </div>
                    <div className="font-bold text-green-800 text-[11px] mt-1 break-all leading-tight">
                      {insight.tertinggi
                        ? formatRpRingkas(insight.tertinggi.harga)
                        : "-"}
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center min-w-0">
                    <div className="text-[9px] text-red-700 font-bold uppercase tracking-widest">
                      Terendah
                    </div>
                    <div className="font-bold text-red-800 text-[11px] mt-1 break-all leading-tight">
                      {insight.terendah
                        ? formatRpRingkas(insight.terendah.harga)
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* Rekomendasi waktu jual */}
                {tren === "turun" && (
                  <div className="mt-3 bg-[#f0b429]/10 border border-[#f0b429]/40 rounded-2xl p-2.5">
                    <p className="text-[10px] text-[#2c5e2e] leading-relaxed">
                      💡 <strong>Harga turun.</strong> Kalau bisa, tahan dulu
                      atau jual sebagian untuk cegah kerugian lebih lanjut.
                    </p>
                  </div>
                )}
                {tren === "naik" && (
                  <div className="mt-3 bg-green-50 border border-green-300 rounded-2xl p-2.5">
                    <p className="text-[10px] text-green-800 leading-relaxed">
                      ✅ <strong>Harga naik!</strong> Waktu bagus untuk jual.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-[#2c5e2e]/10 flex items-center justify-center text-lg flex-shrink-0">
              🎛️
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
                Filter & Pilih Komoditas
              </div>
              <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5">
                Pilih 1 atau lebih komoditas untuk ditampilkan
              </div>
            </div>
          </div>

          <select
            value={filterPenggarap}
            onChange={(e) => setFilterPenggarap(e.target.value)}
            className="border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          >
            <option value="">Semua Penggarap</option>
            {penggaraps.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {komoditasTersedia.map((kom) => {
            const aktif = komoditasTerpilih.has(kom);
            const warna = KOMODITAS_COLOR[kom] || "#666";
            return (
              <button
                key={kom}
                type="button"
                onClick={() => toggleKomoditas(kom)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
                  aktif
                    ? "text-white shadow-md"
                    : "bg-white text-[#2c5e2e] hover:border-[#f0b429]"
                }`}
                style={{
                  backgroundColor: aktif ? warna : undefined,
                  borderColor: aktif ? warna : "rgba(44, 94, 46, 0.2)",
                }}
              >
                {aktif ? "✓" : "○"} {KOMODITAS_LABEL[kom] || kom}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 flex-wrap text-[10px]">
          <button
            type="button"
            onClick={pilihSemua}
            className="text-[#2c5e2e] hover:text-[#f0b429] font-bold underline"
          >
            ✓ Pilih Semua
          </button>
          <button
            type="button"
            onClick={hapusSemua}
            className="text-[#2c5e2e] hover:text-[#f0b429] font-bold underline"
          >
            ✗ Hapus Semua
          </button>
          <span className="text-[#2c5e2e]/50 ml-auto">
            {komoditasTerpilih.size} dari {komoditasTersedia.length} dipilih
          </span>
        </div>
      </div>

      {/* ===== GRAFIK LINE ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-[#f0b429]/15 flex items-center justify-center text-lg flex-shrink-0">
            💰
          </span>
          <div>
            <div className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
              Grafik Harga Komoditas
            </div>
            <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5">
              Non-cabai: rata-rata per bulan · Cabai: rata-rata per musim
            </div>
          </div>
        </div>

        {komoditasTerpilih.size === 0 ? (
          <div className="text-center py-12 text-[#2c5e2e]/40 italic text-sm">
            Pilih minimal 1 komoditas dulu di filter atas
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12 text-[#2c5e2e]/40 italic text-sm">
            Belum ada data untuk ditampilkan
          </div>
        ) : (
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  scale="time"
                  tick={TICK}
                  stroke="#9ca3af"
                  tickFormatter={(ts) =>
                    new Date(ts).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })
                  }
                />
                <YAxis
                  tick={TICK}
                  stroke="#9ca3af"
                  tickFormatter={(v) => formatRpRingkas(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: "2px solid rgba(44, 94, 46, 0.1)",
                  }}
                  labelFormatter={(ts) =>
                    new Date(Number(ts)).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  }
                  formatter={(value: any, name: any) => [
                    formatRpFull(Number(value)),
                    KOMODITAS_LABEL[name] || name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: any) => KOMODITAS_LABEL[value] || value}
                />
                {Array.from(komoditasTerpilih).map((kom) => (
                  <Line
                    key={kom}
                    type="monotone"
                    dataKey={kom}
                    name={kom}
                    stroke={KOMODITAS_COLOR[kom] || "#666"}
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: KOMODITAS_COLOR[kom] || "#666",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 7 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ===== TABEL DETAIL ===== */}
      {komoditasTerpilih.size > 0 && (
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
              📋
            </span>
            <div>
              <div className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
                Detail Harga
              </div>
              <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5">
                Rincian harga per titik data
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from(komoditasTerpilih).map((kom) => {
              const list = dataHarga[kom] || [];
              if (list.length === 0) return null;
              const warna = KOMODITAS_COLOR[kom] || "#666";
              return (
                <div key={kom}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: warna }}
                    />
                    <span className="font-bold text-[#2c5e2e] text-sm">
                      {KOMODITAS_LABEL[kom] || kom}
                    </span>
                    <span className="text-xs text-[#2c5e2e]/60">
                      ({list.length} titik data)
                    </span>
                  </div>
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-[#2c5e2e]/10 text-[#2c5e2e]/60">
                          <th className="text-left py-2 px-2 font-bold uppercase tracking-widest text-[10px]">
                            Periode
                          </th>
                          <th className="text-right py-2 px-2 font-bold uppercase tracking-widest text-[10px]">
                            Harga
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((d, i) => (
                          <tr
                            key={i}
                            className="border-b border-[#2c5e2e]/5 hover:bg-[#f0b429]/5"
                          >
                            <td className="py-2 px-2 text-[#2c5e2e]">
                              {formatTanggal(d.tanggal)}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-[#2c5e2e]">
                              {formatRpFull(d.harga)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
