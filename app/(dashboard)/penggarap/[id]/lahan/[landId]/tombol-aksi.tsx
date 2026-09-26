"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  landId: string;
  penggarapId: string;
  nama: string;
  luas: number;
  lokasiKoordinat: string;
};

export function TombolAksiLahan({
  landId,
  penggarapId,
  nama,
  luas,
  lokasiKoordinat,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama,
    luas: luas.toString(),
    lokasi_koordinat: lokasiKoordinat,
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/lahan/${landId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: form.nama,
        luas: parseFloat(form.luas),
        lokasi_koordinat: form.lokasi_koordinat,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal update: " + (json.error || "Unknown error"));
      return;
    }

    alert("✅ Lahan berhasil diupdate!");
    setShowEdit(false);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Hapus lahan "${nama}"? Data panen terkait juga akan terhapus.`
      )
    )
      return;

    setLoading(true);
    const res = await fetch(`/api/lahan/${landId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal hapus");
      return;
    }

    alert("✅ Lahan berhasil dihapus!");
    router.push(`/penggarap/${penggarapId}`);
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2 rounded-lg transition"
        >
          ✏️ Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
        >
          🗑️ Hapus
        </button>
      </div>

      {showEdit && (
        <form
          onSubmit={handleUpdate}
          className="mt-4 space-y-3 bg-yellow-50 p-4 rounded-lg"
        >
          <h3 className="font-semibold text-gray-800">Edit Lahan</h3>

          {/* ===== TOMBOL GPS WALKING ===== */}
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">📍</span>
              <div className="flex-1">
                <div className="font-bold text-yellow-900 text-xs mb-1">
                  Ukur Ulang dengan GPS Walking
                </div>
                <p className="text-[11px] text-yellow-800 mb-2">
                  Ukur ulang luas lahan ini dengan GPS. Data lahan (nama,
                  riwayat panen) tetap, hanya luas & polygon yang diupdate.
                </p>
                <Link
                  href={`/ukur-lahan?penggarap_id=${penggarapId}&mode=edit&landId=${landId}`}
                  className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  📍 Ukur Ulang GPS
                </Link>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Luas (Ha)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.luas}
              onChange={(e) => setForm({ ...form, luas: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Koordinat GPS (opsional)
            </label>
            <input
              type="text"
              value={form.lokasi_koordinat}
              onChange={(e) =>
                setForm({ ...form, lokasi_koordinat: e.target.value })
              }
              placeholder="-6.994303,112.174348"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "💾 Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2 rounded-lg"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </>
  );
}
