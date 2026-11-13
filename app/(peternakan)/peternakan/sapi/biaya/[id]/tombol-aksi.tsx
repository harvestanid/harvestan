"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function TombolAksi({ id, isDemo }: { id: string; isDemo: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (isDemo) return alert("🔒 Tidak bisa hapus di mode demo");
    if (!confirm(`Hapus log ini?\n\nData akan dihapus permanen.`)) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      const { data: log } = await supabase.from("farm_operational_logs").select("foto_url").eq("id", id).single();
      if (log?.foto_url) {
        try {
          const url = new URL(log.foto_url);
          const parts = url.pathname.split("/livestock-photos/");
          if (parts[1]) await supabase.storage.from("livestock-photos").remove([decodeURIComponent(parts[1])]);
        } catch {}
      }

      const { error } = await supabase.from("farm_operational_logs").delete().eq("id", id);
      if (error) throw error;

      alert("✅ Log berhasil dihapus");
      router.push("/peternakan/sapi/biaya");
      router.refresh();
    } catch (err: any) {
      alert("❌ Gagal hapus: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/peternakan/sapi/biaya/${id}/edit`} className={`flex-1 min-w-[120px] text-center font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md ${isDemo ? "bg-gray-200 text-gray-400 pointer-events-none" : "bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e]"}`}>
        ✏️ Edit Log
      </Link>
      <button type="button" onClick={handleDelete} disabled={loading || isDemo} className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100">
        {loading ? "⏳ Menghapus..." : "🗑️ Hapus Log"}
      </button>
    </div>
  );
}
