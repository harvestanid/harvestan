"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  feedbackId: string;
  isRead: boolean;
  isPinned: boolean;
};

export function TombolAksi({ feedbackId, isRead, isPinned }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAksi(aksi: "read" | "pin" | "delete") {
    if (aksi === "delete") {
      if (!confirm("Hapus feedback ini? Tidak bisa dibatalkan.")) return;
    }

    setLoading(aksi);

    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: aksi === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:
          aksi === "delete"
            ? undefined
            : JSON.stringify({
                action: aksi,
              }),
      });

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
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Tombol Mark Read */}
      <button
        onClick={() => handleAksi("read")}
        disabled={loading !== null || isRead}
        className={`text-[10px] font-medium px-2 py-1 rounded-md transition ${
          isRead
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-100 hover:bg-blue-200 text-blue-700"
        } disabled:opacity-50`}
        title={isRead ? "Sudah dibaca" : "Tandai sudah dibaca"}
      >
        {loading === "read" ? "..." : isRead ? "✓ Dibaca" : "👁️ Tandai Baca"}
      </button>

      {/* Tombol Pin */}
      <button
        onClick={() => handleAksi("pin")}
        disabled={loading !== null}
        className={`text-[10px] font-medium px-2 py-1 rounded-md transition ${
          isPinned
            ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        } disabled:opacity-50`}
        title={isPinned ? "Lepas pin" : "Pin feedback"}
      >
        {loading === "pin" ? "..." : isPinned ? "📌 Pin" : "📍 Pin"}
      </button>

      {/* Tombol Delete */}
      <button
        onClick={() => handleAksi("delete")}
        disabled={loading !== null}
        className="text-[10px] font-medium px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition disabled:opacity-50"
        title="Hapus feedback"
      >
        {loading === "delete" ? "..." : "🗑️ Hapus"}
      </button>
    </div>
  );
}
