"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ActivityLog = {
  id: string;
  tanggal: string;
  jenis: string;
  jenis_custom: string | null;
  judul: string;
  deskripsi: string | null;
  biaya: number;
  keterangan_biaya: string | null;
  foto_url: string | null;
  created_at: string;
};

type Props = {
  logs: ActivityLog[];
  jenisCustom: { id: string; nama: string; emoji: string }[];
  isDemo: boolean;
};

const JENIS_PRESET: Record<string, { emoji: string; label: string; warna: string }> = {
  pemupukan: {
    emoji: "🌱",
    label: "Pemupukan",
    warna: "bg-green-100 text-green-800 border-green-300",
  },
  penyemprotan: {
    emoji: "🧴",
    label: "Penyemprotan",
    warna: "bg-blue-100 text-blue-800 border-blue-300",
  },
  penyiraman: {
    emoji: "💧",
    label: "Penyiraman",
    warna: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  pemangkasan: {
    emoji: "✂️",
    label: "Pemangkasan",
    warna: "bg-purple-100 text-purple-800 border-purple-300",
  },
  cek_hama: {
    emoji: "🐛",
    label: "Cek Hama",
    warna: "bg-red-100 text-red-800 border-red-300",
  },
  penanaman: {
    emoji: "🌾",
    label: "Penanaman",
    warna: "bg-[#f0b429]/20 text-[#2c5e2e] border-[#f0b429]/50",
  },
  lainnya: {
    emoji: "📝",
    label: "Lainnya",
    warna: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function labelJenis(j: ActivityLog, jenisCustom: Props["jenisCustom"]) {
  if (j.jenis === "custom" && j.jenis_custom) {
    const found = jenisCustom.find((c) => c.nama === j.jenis_custom);
    return {
      emoji: found?.emoji || "📝",
      label: j.jenis_custom,
      warna: "bg-orange-100 text-orange-800 border-orange-300",
    };
  }
  return JENIS_PRESET[j.jenis] || JENIS_PRESET.lainnya;
}

export function LogTanamKlien({ logs, jenisCustom, isDemo }: Props) {
  const [filterJenis, setFilterJenis] = useState<string>("");
  const [filterBulan, setFilterBulan] = useState<string>("");
  const [searchJudul, setSearchJudul] = useState<string>("");

  const bulanTersedia = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const d = new Date(l.tanggal);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      set.add(key);
    });
    return Array.from(set).sort().reverse();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterJenis && l.jenis !== filterJenis) return false;
      if (filterBulan) {
        const d = new Date(l.tanggal);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        if (key !== filterBulan) return false;
      }
      if (searchJudul) {
        const q = searchJudul.toLowerCase();
        if (
          !l.judul.toLowerCase().includes(q) &&
          !(l.deskripsi || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, filterJenis, filterBulan, searchJudul]);

  // Statistik bulan ini
  const stats = useMemo(() => {
    const now = new Date();
    const bulanIni = logs.filter((l) => {
      const d = new Date(l.tanggal);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    });
    const totalBiaya = bulanIni.reduce((s, l) => s + Number(l.biaya || 0), 0);
    return {
      jmlBulanIni: bulanIni.length,
      totalBiayaBulanIni: totalBiaya,
    };
  }, [logs]);

  const adaFilterAktif = filterJenis || filterBulan || searchJudul;

  function resetFilter() {
    setFilterJenis("");
    setFilterBulan("");
    setSearchJudul("");
  }

  return (
    <div className="space-y-4">
      {/* STATISTIK BULAN INI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-lg shadow-[#2c5e2e]/5">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-[10px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest">
            Log Bulan Ini
          </div>
          <div className="text-2xl font-bold text-[#2c5e2e] mt-1">
            {stats.jmlBulanIni}
          </div>
        </div>
        <div className="bg-white border-2 border-[#f0b429]/40 rounded-3xl p-4 shadow-lg shadow-[#f0b429]/10">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-[10px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest">
            Biaya Bulan Ini
          </div>
          <div className="text-xl font-bold text-[#2c5e2e] mt-1 break-all">
            {formatRp(stats.totalBiayaBulanIni)}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
              🔍 Cari
            </label>
            <input
              type="text"
              value={searchJudul}
              onChange={(e) => setSearchJudul(e.target.value)}
              placeholder="Cari judul / deskripsi..."
              className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
              Jenis
            </label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
            >
              <option value="">Semua</option>
              {Object.entries(JENIS_PRESET).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
              {jenisCustom.length > 0 && (
                <optgroup label="── Custom ──">
                  {jenisCustom.map((c) => (
                    <option key={c.id} value={`custom:${c.nama}`}>
                      {c.emoji} {c.nama}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
              Bulan
            </label>
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
            >
              <option value="">Semua</option>
              {bulanTersedia.map((b) => {
                const [y, m] = b.split("-");
                const label = new Date(
                  parseInt(y),
                  parseInt(m) - 1
                ).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <option key={b} value={b}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {adaFilterAktif && (
            <button
              onClick={resetFilter}
              className="bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] text-xs font-bold px-4 py-2.5 rounded-full transition-all"
            >
              🔄 Reset
            </button>
          )}

          <div className="text-xs text-[#2c5e2e]/60 italic ml-auto">
            {filteredLogs.length} dari {logs.length} log
          </div>
        </div>
      </div>

      {/* LIST LOGS */}
      {logs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4 opacity-40">📋</div>
          <h3 className="font-bold text-[#2c5e2e] mb-2">Belum ada log</h3>
          <p className="text-[#2c5e2e]/60 text-sm mb-6 max-w-md mx-auto">
            Mulai catat aktivitas harian di lahan — pemupukan, penyemprotan,
            cek hama, dan lainnya.
          </p>
          <Link
            href="/log-tanam/baru"
            className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-[1.02] shadow-md"
          >
            + Tambah Log Pertama
          </Link>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-2 opacity-40">🔍</div>
          <p className="text-[#2c5e2e]/60 text-sm">
            Gak ada log yang cocok dengan filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((l) => {
            const jenis = labelJenis(l, jenisCustom);
            return (
              <Link
                key={l.id}
                href={`/log-tanam/${l.id}`}
                className="block bg-white border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/50 rounded-3xl p-4 transition-all hover:shadow-lg hover:shadow-[#f0b429]/10 group"
              >
                <div className="flex items-start gap-3 flex-wrap">
                  {l.foto_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.foto_url}
                      alt={l.judul}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl flex-shrink-0 group-hover:scale-[1.03] transition-transform"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest ${jenis.warna}`}
                      >
                        {jenis.emoji} {jenis.label}
                      </span>
                      <span className="text-[10px] text-[#2c5e2e]/60 font-medium">
                        📅 {formatTanggal(l.tanggal)}
                      </span>
                    </div>
                    <div className="font-bold text-[#2c5e2e] text-base mb-1 leading-tight">
                      {l.judul}
                    </div>
                    {l.deskripsi && (
                      <p className="text-xs text-[#2c5e2e]/70 leading-relaxed line-clamp-2 mb-2">
                        {l.deskripsi}
                      </p>
                    )}
                    {Number(l.biaya) > 0 && (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-bold text-[#2c5e2e]">
                          💰 {formatRp(Number(l.biaya))}
                        </span>
                        {l.keterangan_biaya && (
                          <span className="text-[#2c5e2e]/60">
                            — {l.keterangan_biaya}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[#2c5e2e]/30 group-hover:text-[#f0b429] group-hover:translate-x-1 transition-all text-xl flex-shrink-0">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isDemo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-4">
          <div className="text-xs text-blue-800 leading-relaxed text-center">
            ℹ️ <strong>Mode Demo</strong> — data log yang kamu lihat contoh.
            Data asli kamu aman.
          </div>
        </div>
      )}
    </div>
  );
}
