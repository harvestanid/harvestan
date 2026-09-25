"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  debtId: string;
  penggarapId: string;
  jumlah: number;
  dibayar: number;
  keperluan: string;
};

export function TombolAksiHutang({
  debtId,
  penggarapId,
  jumlah,
  dibayar,
  keperluan,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    jumlah: jumlah.toString(),
    dibayar: dibayar.toString(),
    keperluan,
  });

  const sisa = Math.max(0, jumlah - dibayar);
  const isLunas = sisa <= 0;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const jumlahNum = parseFloat(form.jumlah);
    const dibayarNum = parseFloat(form.dibayar) || 0;

    if (isNaN(jumlahNum) || jumlahNum <= 0) {
      alert("❌ Jumlah tidak valid");
      setLoading(false);
      return;
    }

    if (dibayarNum > jumlahNum) {
      alert("❌ Dibayar tidak boleh lebih dari jumlah");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/hutang/${debtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jumlah: jumlahNum,
        dibayar: dibayarNum,
        keperluan: form.keperluan,
        tanggal: new Date().toISOString().split("T")[0],
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal update: " + (json.error || "Unknown error"));
      return;
    }

    alert("✅ Hutang berhasil diupdate!");
    setShowEdit(false);
    router.refresh();
  }

  async function handleLunasi() {
    if (!confirm(`Lunasi sisa hutang Rp ${sisa.toLocaleString("id-ID")}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/hutang/${debtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jumlah,
        dibayar: jumlah,
        keperluan,
        tanggal: new Date().toISOString().split("T")[0],
      }),
    });
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal lunasi");
      return;
    }

    alert("✅ Hutang berhasil dilunasi!");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Hapus data hutang ini?")) return;

    setLoading(true);
    const res = await fetch(`/api/hutang/${debtId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal hapus");
      return;
    }

    alert("✅ Hutang berhasil dihapus!");
    router.push(`/penggarap/${penggarapId}`);
  }

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2 rounded-lg transition"
        >
          ✏️ Edit
        </button>
        {!isLunas && (
          <button
            onClick={handleLunasi}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
          >
            ✅ Lunasi
          </button>
        )}
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
          <h3 className="font-semibold text-gray-800">Edit Hutang</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={form.jumlah}
              onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sudah Dibayar (Rp)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.dibayar}
              onChange={(e) => setForm({ ...form, dibayar: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keperluan
            </label>
            <input
              type="text"
              value={form.keperluan}
              onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
