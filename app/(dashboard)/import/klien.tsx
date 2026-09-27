"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

type Preview = {
  penggarap: number;
  lahan: number;
  panen: number;
  hutang: number;
  kategori: number;
  musim: number;
  tanggalExport: string;
};

export function ImportKlien() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("replace");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState<any>(null);

  async function handlePilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setPreview(null);
    setSukses(null);

    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      // Cek sheet Info
      const wsInfo = wb.Sheets["Info"];
      if (!wsInfo) {
        setError(
          "❌ File tidak valid. Pastikan file dari tombol 'Export Backup'."
        );
        return;
      }

      const infoRows: any[] = XLSX.utils.sheet_to_json(wsInfo, {
        header: 1,
        defval: "",
      });
      let tipeFile = "";
      let tanggalExport = "";
      infoRows.forEach((r) => {
        if (r[0] === "tipe_file") tipeFile = r[1];
        if (r[0] === "tanggal_export") tanggalExport = r[1];
      });

      if (tipeFile !== "BACKUP") {
        setError(
          "❌ File ini bukan backup. Gunakan tombol 'Export Backup', bukan 'Export Laporan'."
        );
        return;
      }

      const hitungSheet = (name: string) => {
        const ws = wb.Sheets[name];
        if (!ws) return 0;
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        return rows.filter((r) => {
          // Minimal ada field id/nama/komoditas
          return (
            r.id ||
            r.nama ||
            r.komoditas ||
            r.tanggal
          );
        }).length;
      };

      setPreview({
        penggarap: hitungSheet("Penggarap"),
        lahan: hitungSheet("Lahan"),
        panen: hitungSheet("Panen"),
        hutang: hitungSheet("Hutang"),
        kategori: hitungSheet("Kategori"),
        musim: hitungSheet("MusimCabai"),
        tanggalExport,
      });
    } catch (err) {
      setError("❌ Gagal baca file. Pastikan format .xlsx valid.");
    }
  }

  async function handleImport() {
    if (!file) {
      setError("❌ Pilih file dulu");
      return;
    }
    if (!preview) {
      setError("❌ Preview belum siap. Coba upload ulang.");
      return;
    }

    const confirmMsg =
      mode === "replace"
        ? `⚠️ MODE TIMPA\n\nSemua data Anda saat ini akan DIHAPUS dan diganti dengan data dari file.\n\nYakin lanjut?`
        : `ℹ️ MODE TAMBAH\n\nData dari file akan DITAMBAHKAN ke data yang sudah ada.\n\nLanjut?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError("");
    setSukses(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);

      const res = await fetch("/api/import", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        setError("❌ " + (json.error || "Gagal import"));
        return;
      }

      setSukses(json);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError("❌ " + (err.message || "Gagal import"));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFile(null);
    setPreview(null);
    setError("");
    setSukses(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      {/* ===== UPLOAD ===== */}
      {!sukses && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📁 Pilih File Backup (.xlsx)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handlePilihFile}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-700 file:text-white file:font-medium hover:file:bg-green-800 cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 File harus dari tombol <strong>Export Backup</strong> di halaman{" "}
            <a href="/export" className="text-green-700 underline">
              Export
            </a>
            .
          </p>
        </div>
      )}

      {/* ===== ERROR ===== */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ===== PREVIEW ===== */}
      {preview && !sukses && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900">📊 Preview File</h3>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-green-700 font-medium">
                PENGGARAP
              </div>
              <div className="text-lg font-bold text-green-900">
                {preview.penggarap}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-blue-700 font-medium">LAHAN</div>
              <div className="text-lg font-bold text-blue-900">
                {preview.lahan}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-yellow-700 font-medium">
                PANEN
              </div>
              <div className="text-lg font-bold text-yellow-900">
                {preview.panen}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-red-700 font-medium">HUTANG</div>
              <div className="text-lg font-bold text-red-900">
                {preview.hutang}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-orange-700 font-medium">
                KATEGORI
              </div>
              <div className="text-lg font-bold text-orange-900">
                {preview.kategori}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-purple-700 font-medium">
                MUSIM
              </div>
              <div className="text-lg font-bold text-purple-900">
                {preview.musim}
              </div>
            </div>
          </div>

          {preview.tanggalExport && (
            <p className="text-xs text-gray-500 italic">
              Tanggal export: {preview.tanggalExport}
            </p>
          )}
        </div>
      )}

      {/* ===== PILIH MODE ===== */}
      {preview && !sukses && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <h3 className="font-bold text-gray-900">⚙️ Mode Import</h3>

          <button
            onClick={() => setMode("replace")}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              mode === "replace"
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className="font-bold text-gray-900">
              🔴 Timpa Semua Data
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Hapus semua data saat ini, lalu ganti dengan data dari file.
            </div>
          </button>

          <button
            onClick={() => setMode("merge")}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              mode === "merge"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className="font-bold text-gray-900">
              🔵 Tambah ke Data Ada
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Data dari file ditambahkan ke data yang sudah ada (tidak
              menimpa).
            </div>
          </button>

          <div
            className={`rounded-lg p-3 text-xs ${
              mode === "replace"
                ? "bg-red-100 border border-red-300 text-red-800"
                : "bg-blue-100 border border-blue-300 text-blue-800"
            }`}
          >
            {mode === "replace" ? (
              <>
                ⚠️ <strong>PERHATIAN:</strong> Semua penggarap, lahan, panen,
                dan hutang yang ada saat ini akan <strong>DIHAPUS</strong>.
                Pastikan Anda sudah backup data lama!
              </>
            ) : (
              <>
                ℹ️ Data dari file akan <strong>ditambahkan</strong> ke akun
                Anda. Data lama tetap aman.
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition"
            >
              Batal / Ganti File
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className={`flex-1 font-bold py-3 rounded-lg transition text-white ${
                mode === "replace"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              {loading
                ? "⏳ Memproses..."
                : mode === "replace"
                ? "🔴 Timpa Data"
                : "🔵 Tambah Data"}
            </button>
          </div>
        </div>
      )}

      {/* ===== SUKSES ===== */}
      {sukses && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 space-y-3">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-bold text-green-900 text-lg">
              Import Berhasil!
            </h3>
            <p className="text-sm text-green-700">
              Mode: {sukses.mode === "replace" ? "Timpa" : "Tambah"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3">
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">PENGGARAP</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.penggarap}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">LAHAN</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.lahan}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">PANEN</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.panen}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">HUTANG</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.hutang}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">KATEGORI</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.kategori}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-[10px] text-green-700">MUSIM</div>
              <div className="text-lg font-bold text-green-900">
                {sukses.summary.musim}
              </div>
            </div>
          </div>

          <p className="text-xs text-green-700 italic text-center pt-2">
            Redirect ke dashboard dalam 2 detik...
          </p>
        </div>
      )}
    </div>
  );
}
