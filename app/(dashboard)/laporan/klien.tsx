"use client";

import { useState } from "react";

type Props = {
  tahunTersedia: number[];
};

export function LaporanClient({ tahunTersedia }: Props) {
  const tahunSekarang = new Date().getFullYear();
  const [jenis, setJenis] = useState<"tahunan" | "limaTahunan">("tahunan");
  const [tahun, setTahun] = useState<number>(
    tahunTersedia[0] || tahunSekarang
  );
  const [mode, setMode] = useState<"terakhir" | "ratarata">("ratarata");
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    try {
      const url = `/api/export-laporan?tahun=${tahun}&jenis=${jenis}&mode=${mode}`;
      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("❌ Gagal generate: " + (err.error || "Unknown"));
        return;
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Laporan_${jenis}_${tahun}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal download"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Laporan ini mencakup:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Ringkasan kondisi lahan & kategori produktivitas</li>
              <li>Leaderboard penggarap dengan evaluasi bintang ⭐</li>
              <li>Rekomendasi reward (⭐⭐⭐) & pendampingan (⚠️)</li>
              <li>Ringkasan profit owner & penggarap</li>
              <li>Ringkasan hutang per penggarap</li>
            </ul>
            <p className="mt-2 text-xs italic">
              💡 Rekomendasi muncul kalau kategori produktivitas sudah di-set di{" "}
              <a href="/pengaturan" className="underline font-bold">
                Pengaturan
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Pilih Jenis Laporan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Laporan
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setJenis("tahunan")}
              className={`p-4 rounded-lg border-2 transition text-left ${
                jenis === "tahunan"
                  ? "bg-green-50 border-green-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900">📅 Tahunan</div>
              <div className="text-xs text-gray-600 mt-1">
                Laporan 1 tahun
              </div>
            </button>
            <button
              onClick={() => setJenis("limaTahunan")}
              className={`p-4 rounded-lg border-2 transition text-left ${
                jenis === "limaTahunan"
                  ? "bg-green-50 border-green-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900">📊 5 Tahunan</div>
              <div className="text-xs text-gray-600 mt-1">
                Laporan 5 tahun terakhir
              </div>
            </button>
          </div>
        </div>

        {/* Pilih Tahun */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun {jenis === "limaTahunan" && "(akhir periode)"}
          </label>
          {tahunTersedia.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Belum ada data panen. Tambah data panen dulu.
            </div>
          ) : (
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {tahunTersedia.map((y) => (
                <option key={y} value={y}>
                  {y}
                  {jenis === "limaTahunan" ? ` (${y - 4} - ${y})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Pilih Mode Sumber Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sumber Data Produktivitas
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("ratarata")}
              className={`p-3 rounded-lg border-2 transition text-left ${
                mode === "ratarata"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900 text-sm">
                📊 Rata-rata
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Dari semua panen
              </div>
            </button>
            <button
              onClick={() => setMode("terakhir")}
              className={`p-3 rounded-lg border-2 transition text-left ${
                mode === "terakhir"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-900 text-sm">
                🎯 Panen Terakhir
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Dari panen terbaru
              </div>
            </button>
          </div>
        </div>

        {/* Tombol Generate */}
        <button
          onClick={handleDownload}
          disabled={loading || tahunTersedia.length === 0}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>⏳ Membuat Laporan...</>
          ) : (
            <>📄 Download Laporan PDF</>
          )}
        </button>
      </div>
    </div>
  );
}
