"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPenggarap } from "@/lib/supabase/queries/penggarap";

export default function TambahPenggarapPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [usia, setUsia] = useState("");
  const [kontak, setKontak] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createPenggarap({
      nama: nama.trim(),
      alamat: alamat.trim(),
      usia: usia ? parseInt(usia) : undefined,
      kontak: kontak.trim(),
    });

    if (!result.success) {
      setError(result.error || "Gagal menyimpan");
      setLoading(false);
      return;
    }

    router.push("/penggarap");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/penggarap"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          👨‍🌾 Tambah Penggarap
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Isi data penggarap baru
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usia
            </label>
            <input
              type="number"
              value={usia}
              onChange={(e) => setUsia(e.target.value)}
              placeholder="45"
              min="1"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Kontak
            </label>
            <input
              type="tel"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              placeholder="08123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat
          </label>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Dusun, Desa, Kecamatan, Kabupaten"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Menyimpan..." : "Simpan Penggarap"}
          </button>
          <Link
            href="/penggarap"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
