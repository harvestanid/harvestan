"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TombolAksiKalender({ id }: { id: string }) {
  const router = useRouter();
  const [hapusLoading, setHapusLoading] = useState(false);

  async function handleHapus() {
    if (!confirm("⚠️ Hapus kalender ini?\n\nSemua jadwal kegiatan di dalamnya akan ikut terhapus.")) return;
    setHapusLoading(true);
    try {
      const res = await fetch(`/api/kalender/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      alert("✅ Kalender berhasil dihapus");
      router.push("/kalender-tanam");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <a
        href={`/api/kalender/${id}/ics`}
        className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold text-center py-3 rounded-full transition shadow-md"
      >
        📲 Simpan ke Kalender HP
      </a>
      <a
        href={`/kalender-tanam/${id}/pdf`}
        className="flex-1 min-w-[140px] bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] text-sm font-bold text-center py-3 rounded-full transition shadow-md"
      >
        📄 Download PDF
      </a>
      <button
        onClick={handleHapus}
        disabled={hapusLoading}
        className="flex-1 min-w-[100px] bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold text-center py-3 rounded-full transition disabled:opacity-50"
      >
        {hapusLoading ? "Menghapus..." : "🗑️ Hapus"}
      </button>
    </div>
  );
}
