"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePenggarap } from "@/lib/supabase/queries/penggarap";

export default function TombolAksiPenggarap({
  penggarap,
  totalLuas,
  landsCount,
}: {
  penggarap: {
    id: string;
    nama: string;
    alamat: string | null;
    usia: number | null;
    kontak: string | null;
  };
  totalLuas: number;
  landsCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Form state
  const [nama, setNama] = useState(penggarap.nama);
  const [alamat, setAlamat] = useState(penggarap.alamat || "");
  const [usia, setUsia] = useState(penggarap.usia?.toString() || "");
  const [kontak, setKontak] = useState(penggarap.kontak || "");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/penggarap/${penggarap.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: nama.trim(),
        alamat: alamat.trim(),
        usia: usia ? parseInt(usia) : null,
        kontak: kontak.trim(),
      }),
    });

    setLoading(false);
    if (res.ok) {
      setShowEdit(false);
      router.refresh();
    } else {
      alert("Gagal update");
    }
  }

  async function handleDelete() {
    if (landsCount > 0) {
      alert(
        `⚠️ Tidak bisa hapus ${penggarap.nama} karena masih punya ${landsCount} lahan.\n\nHapus semua lahan dulu.`
      );
      return;
    }

    if (
      !confirm(
        `Yakin hapus ${penggarap.nama}?\n\nData akan dihapus permanen dari database.`
      )
    )
      return;

    setLoading(true);
    const result = await deletePenggarap(penggarap.id);
    setLoading(false);

    if (result.success) {
      router.push("/penggarap");
      router.refresh();
    } else {
      alert("Gagal hapus: " + result.error);
    }
  }

  if (showEdit) {
    return (
      <form
        onSubmit={handleUpdate}
        className="bg-white border border-gray-200 rounded-xl p-4 w-full"
      >
        <h3 className="font-bold text-gray-900 mb-3 text-sm">✏️ Edit Penggarap</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={usia}
              onChange={(e) => setUsia(e.target.value)}
              placeholder="Usia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="tel"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              placeholder="Kontak"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowEdit(true)}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
      >
        ✏️ Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
      >
        🗑️ Hapus
      </button>
    </div>
  );
}
