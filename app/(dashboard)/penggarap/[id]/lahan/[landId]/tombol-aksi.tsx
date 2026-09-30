"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  landId: string;
  penggarapId: string;
  namaLahan: string;
  luas: number;
};

export function TombolAksiLahan({
  landId,
  penggarapId,
  namaLahan,
  luas,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Hapus lahan "${namaLahan}"?\n\nData panen terkait juga akan terhapus permanen.`
      )
    )
      return;

    setLoading(true);
    const res = await fetch(`/api/lahan/${landId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert("❌ Gagal hapus: " + (json.error || "Unknown error"));
      return;
    }

    alert("✅ Lahan berhasil dihapus!");
    router.push(`/penggarap/${penggarapId}`);
    router.refresh();
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <Link
        href={`/penggarap/${penggarapId}/lahan/${landId}/edit`}
        className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] shadow-md text-sm"
      >
        ✏️ Edit Lahan
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] shadow-md text-sm disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? "⏳ Menghapus..." : "🗑️ Hapus Lahan"}
      </button>
    </div>
  );
}
