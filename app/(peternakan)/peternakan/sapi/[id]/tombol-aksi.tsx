"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function TombolAksiSapi({ id, isDemo }: { id: string; isDemo: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (isDemo) return alert("🔒 Tidak bisa hapus di mode demo");
    if (!confirm(`Hapus Sapi ini?\n\nSemua data timbang, riwayat pertumbuhan, dan data terkait akan dihapus permanen.`)) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      // Hapus Sapi (Tabel measurements terhapus otomatis karena ON DELETE CASCADE, jika diset di DB)
      const { error } = await supabase.from("livestocks").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;

      alert("✅ Sapi berhasil dihapus");
      router.push("/peternakan/sapi");
      router.refresh();
    } catch (err: any) {
      alert("❌ Gagal hapus: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-[#2c5e2e]/10">
      <Link href={`/peternakan/sapi/${id}/edit`} className={`flex-1 min-w-[120px] text-center font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md ${isDemo ? "bg-gray-200 text-gray-400 pointer-events-none" : "bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e]"}`}>
        ✏️ Edit Sapi
      </Link>
      <button type="button" onClick={handleDelete} disabled={loading || isDemo} className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100">
        {loading ? "⏳ Menghapus..." : "🗑️ Hapus Sapi"}
      </button>
    </div>
  );
}
