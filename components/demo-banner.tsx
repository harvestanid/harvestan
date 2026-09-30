"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  expiresAt: string;
  daysRemaining: number | null;
  canRestart: boolean;
};

export function DemoBanner({ expiresAt, daysRemaining, canRestart }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStop, setLoadingStop] = useState(false);

  async function handleRestart() {
    if (
      !confirm(
        "Restart demo? Data demo akan di-reset ke awal. Data asli Anda tetap aman."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch("/api/demo/restart", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal restart demo"));
        return;
      }
      alert("✅ Demo berhasil di-restart!");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    if (
      !confirm(
        "Selesai demo? Anda akan kembali ke data asli Anda. Data demo akan dihapus."
      )
    )
      return;

    setLoadingStop(true);
    try {
      const res = await fetch("/api/demo/stop", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal selesai demo"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoadingStop(false);
    }
  }

  const expiresDate = new Date(expiresAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] text-white border-b-2 border-[#f0b429]/40">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f0b429]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-3 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-[#2c5e2e] text-lg flex-shrink-0 font-bold">
            🎬
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">
              Mode Demo Aktif
            </div>
            <div className="text-[10px] text-white/70">
              Berakhir {expiresDate}
              {daysRemaining !== null &&
                ` · ${daysRemaining} hari lagi`}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canRestart && (
            <button
              onClick={handleRestart}
              disabled={loading || loadingStop}
              className="text-xs bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? "⏳" : "🔄 Restart"}
            </button>
          )}

          <Link
            href="/premium"
            className="text-xs bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
          >
            💎 Upgrade
          </Link>

          <button
            onClick={handleStop}
            disabled={loading || loadingStop}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 disabled:opacity-50"
          >
            {loadingStop ? "⏳" : "✅ Selesai Demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
