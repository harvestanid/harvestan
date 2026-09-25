"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  harvestId: string;
  penggarapId: string;
  landId: string;
};

export function TombolAksiPanen({ harvestId, penggarapId, landId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Hapus data panen ini? Tidak bisa dibatalkan.")) return;

    setLoading(true);
    const res = await fetch(`/api/panen/${harvestId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal hapus");
      return;
    }

    alert("✅ Panen berhasil dihapus!");
    router.push(`/penggarap/${penggarapId}/lahan/${landId}`);
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Menghapus..." : "🗑️ Hapus Panen"}
      </button>
    </div>
  );
}
