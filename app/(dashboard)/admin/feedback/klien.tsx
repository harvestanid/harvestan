"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TombolAksi } from "./tombol-aksi";

type Feedback = {
  id: string;
  rating: number;
  saran_fitur: string | null;
  masukan: string | null;
  is_read: boolean;
  is_pinned: boolean;
  created_at: string;
};

type Stats = {
  total: number;
  avgRating: number;
  totalBulanIni: number;
  totalBelumDibaca: number;
  distribusi: {
    bintang1: number;
    bintang2: number;
    bintang3: number;
    bintang4: number;
    bintang5: number;
  };
  perBulan: Array<{
    bulan: string;
    label: string;
    count: number;
    avgRating: number;
  }>;
};

type Props = {
  feedbacks: Feedback[];
  stats: Stats;
};

const WARNA_BINTANG: string[] = [
  "#e74c3c", // 1 bintang - merah
  "#e67e22", // 2 bintang - oranye
  "#f39c12", // 3 bintang - kuning
  "#3498db", // 4 bintang - biru
  "#27ae60", // 5 bintang - hijau
];

function formatTanggal(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffJam = Math.floor(diffMs / 3600000);
    const diffHari = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffJam < 24) return `${diffJam} jam lalu`;
    if (diffHari < 7) return `${diffHari} hari lalu`;

    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTanggalLengkap(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminFeedbackKlien({ feedbacks, stats }: Props) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "unread" | "pinned"
  >("all");
  const [search, setSearch] = useState("");

  // Filter feedback
  const filtered = useMemo(() => {
    let list = [...feedbacks];

    if (filterRating !== null) {
      list = list.filter((f) => f.rating === filterRating);
    }

    if (filterStatus === "unread") {
      list = list.filter((f) => !f.is_read);
    } else if (filterStatus === "pinned") {
      list = list.filter((f) => f.is_pinned);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          (f.saran_fitur || "").toLowerCase().includes(q) ||
          (f.masukan || "").toLowerCase().includes(q)
      );
    }

    // Sort: pinned dulu, lalu terbaru
    list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    return list;
  }, [feedbacks, filterRating, filterStatus, search]);

  // Data untuk chart distribusi
  const dataDistribusi = [
    { bintang: "1⭐", jumlah: stats.distribusi.bintang1, warna: WARNA_BINTANG[0] },
    { bintang: "2⭐", jumlah: stats.distribusi.bintang2, warna: WARNA_BINTANG[1] },
    { bintang: "3⭐", jumlah: stats.distribusi.bintang3, warna: WARNA_BINTANG[2] },
    { bintang: "4⭐", jumlah: stats.distribusi.bintang4, warna: WARNA_BINTANG[3] },
    { bintang: "5⭐", jumlah: stats.distribusi.bintang5, warna: WARNA_BINTANG[4] },
  ];

  // Data untuk chart tren bulanan
  const dataBulanan = stats.perBulan.map((b) => ({
    label: b.label,
    count: b.count,
    avgRating: Number(b.avgRating.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* ===== STATISTIK CARD ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl p-4">
          <div className="text-xs text-yellow-800 font-medium mb-1">
            ⭐ RATA-RATA
          </div>
          <div className="text-3xl font-bold text-yellow-900">
            {stats.avgRating.toFixed(1)}
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            dari 5.0
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-4">
          <div className="text-xs text-blue-800 font-medium mb-1">
            📊 TOTAL
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {stats.total}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            feedback
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-4">
          <div className="text-xs text-green-800 font-medium mb-1">
            📅 BULAN INI
          </div>
          <div className="text-3xl font-bold text-green-900">
            {stats.totalBulanIni}
          </div>
          <div className="text-xs text-green-700 mt-1">
            feedback baru
          </div>
        </div>

        <div
          className={`bg-gradient-to-br rounded-2xl p-4 border-2 ${
            stats.totalBelumDibaca > 0
              ? "from-red-50 to-red-100 border-red-300"
              : "from-gray-50 to-gray-100 border-gray-200"
          }`}
        >
          <div
            className={`text-xs font-medium mb-1 ${
              stats.totalBelumDibaca > 0 ? "text-red-800" : "text-gray-600"
            }`}
          >
            🔔 BELUM DIBACA
          </div>
          <div
            className={`text-3xl font-bold ${
              stats.totalBelumDibaca > 0 ? "text-red-900" : "text-gray-600"
            }`}
          >
            {stats.totalBelumDibaca}
          </div>
          <div
            className={`text-xs mt-1 ${
              stats.totalBelumDibaca > 0 ? "text-red-700" : "text-gray-500"
            }`}
          >
            {stats.totalBelumDibaca > 0 ? "perlu dicek" : "semua dibaca"}
          </div>
        </div>
      </div>

      {/* ===== CHART ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribusi Rating */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">
            📊 Distribusi Rating
          </h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={dataDistribusi} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bintang" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value: any) => [`${value} feedback`, "Jumlah"]}
                />
                <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                  {dataDistribusi.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.warna} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tren Rating Bulanan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">
            📈 Tren Bulanan
          </h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={dataBulanan} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  domain={[0, 5]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Jumlah"
                  stroke="#3498db"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3498db" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRating"
                  name="Rating"
                  stroke="#f39c12"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f39c12" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== FILTER ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cari di saran fitur atau masukan..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
        />

        {/* Filter rating */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-600">
            Rating:
          </span>
          <button
            onClick={() => setFilterRating(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              filterRating === null
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Semua
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterRating === r
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r}⭐
            </button>
          ))}
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-600">
            Status:
          </span>
          {[
            { val: "all" as const, label: "📋 Semua" },
            { val: "unread" as const, label: "🔔 Belum Dibaca" },
            { val: "pinned" as const, label: "📌 Pinned" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterStatus(f.val)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterStatus === f.val
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}

          <span className="text-xs text-gray-500 ml-auto">
            Menampilkan {filtered.length} dari {feedbacks.length}
          </span>
        </div>
      </div>

      {/* ===== LIST FEEDBACK ===== */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 italic text-sm">
              {feedbacks.length === 0
                ? "Belum ada feedback masuk"
                : "Tidak ada feedback yang cocok dengan filter"}
            </p>
          </div>
        ) : (
          filtered.map((f) => (
            <div
              key={f.id}
              className={`bg-white border-2 rounded-2xl p-5 transition ${
                f.is_pinned
                  ? "border-yellow-400 bg-yellow-50/30"
                  : !f.is_read
                  ? "border-blue-300 bg-blue-50/20"
                  : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Bintang */}
                  <div className="text-lg">
                    {"⭐".repeat(f.rating)}
                    {"☆".repeat(5 - f.rating)}
                  </div>

                  {/* Badge status */}
                  {f.is_pinned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-900">
                      📌 PINNED
                    </span>
                  )}
                  {!f.is_read && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                      🔵 BARU
                    </span>
                  )}
                </div>

                <div
                  className="text-xs text-gray-500"
                  title={formatTanggalLengkap(f.created_at)}
                >
                  {formatTanggal(f.created_at)}
                </div>
              </div>

              {/* Content */}
              {f.saran_fitur && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-green-800 mb-1">
                    💡 Saran Fitur
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {f.saran_fitur}
                  </p>
                </div>
              )}

              {f.masukan && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-purple-800 mb-1">
                    💬 Masukan / Kritik
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {f.masukan}
                  </p>
                </div>
              )}

              {/* Aksi */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[10px] text-gray-400">
                  ID: {f.id.substring(0, 8)}
                </div>
                <TombolAksi
                  feedbackId={f.id}
                  isRead={f.is_read}
                  isPinned={f.is_pinned}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
