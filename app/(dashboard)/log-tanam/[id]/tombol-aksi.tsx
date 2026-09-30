"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = {
  logId: string;
  judul: string;
  isDemo?: boolean;
};

export function TombolAksiLog({ logId, judul, isDemo = false }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (isDemo) {
      alert("🔒 Tidak bisa hapus di mode demo");
      return;
    }

    if (
      !confirm(
        `Hapus log "${judul}"?\n\nData akan dihapus permanen.`
      )
    )
      return;

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");

      // Ambil foto_url dulu buat hapus dari storage
      const { data: log } = await supabase
        .from("activity_logs")
        .select("foto_url")
        .eq("id", logId)
        .eq("user_id", user.id)
        .single();

      // Hapus foto dari storage (kalau ada)
      if (log?.foto_url) {
        try {
          const url = new URL(log.foto_url);
          const pathParts = url.pathname.split("/activity-photos/");
          if (pathParts[1]) {
            await supabase.storage
              .from("activity-photos")
              .remove([decodeURIComponent(pathParts[1])]);
          }
        } catch (e) {
          console.error("Gagal hapus foto:", e);
        }
      }

      // Hapus row
      const { error } = await supabase
        .from("activity_logs")
        .delete()
        .eq("id", logId)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      alert("✅ Log berhasil dihapus");
      router.push("/log-tanam");
      router.refresh();
    } catch (err: any) {
      console.error("Hapus log error:", err);
      alert("❌ Gagal hapus: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/log-tanam/${logId}/edit`}
        className={`flex-1 min-w-[120px] text-center font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md ${
          isDemo
            ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
            : "bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e]"
        }`}
      >
        ✏️ Edit Log
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading || isDemo}
        className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? "⏳ Menghapus..." : "🗑️ Hapus Log"}
      </button>
    </div>
  );
}
