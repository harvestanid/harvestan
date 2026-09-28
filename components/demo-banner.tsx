"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  expiresAt: string | null;
  daysRemaining: number | null;
  canRestart: boolean;
};

export function DemoBanner({ expiresAt, daysRemaining, canRestart }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  async function handleStop() {
    setLoading("stop");
    try {
      const res = await fetch("/api/demo/stop", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }
      setShowConfirmStop(false);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal"));
    } finally {
      setLoading(null);
    }
  }

  async function handleRestart() {
    setLoading("restart");
    try {
      const res = await fetch("/api/demo/restart", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-white/30 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
              MODE DEMO
            </span>
            <span className="text-xs md:text-sm font-medium">
              Anda sedang menjelajah data contoh
            </span>
            {daysRemaining !== null && (
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full">
                ⏱️ {daysRemaining} hari tersisa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canRestart && (
              <button
                onClick={handleRestart}
                disabled={loading !== null}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                {loading === "restart" ? "⏳..." : "🔄 Restart"}
              </button>
            )}
            <button
              onClick={() => setShowConfirmStop(true)}
              disabled={loading !== null}
              className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              ✅ Selesai Demo
            </button>
          </div>
        </div>
      </div>

      {/* Modal konfirmasi stop */}
      {showConfirmStop && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirmStop(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 text-center">
              <div className="text-5xl mb-3">🎬</div>
              <h2 className="text-xl font-bold mb-1">Selesai Demo?</h2>
              <p className="text-sm text-white/90">
                Data demo akan dihapus permanen
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>Yang akan terjadi:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Data demo akan <strong>dihapus</strong></li>
                  <li>Anda kembali ke data real</li>
                  <li>Fitur premium kembali locked</li>
                  <li>Bisa mulai demo lagi kapan saja</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmStop(false)}
                  disabled={loading !== null}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading !== null}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading === "stop" ? "⏳..." : "✅ Selesai Demo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
