"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type PremiumRequest = {
  id: string;
  user_id: string;
  tipe: string;
  platform: string | null;
  link_post: string | null;
  screenshot_url: string | null;
  catatan_user: string | null;
  status: "pending" | "approved" | "rejected";
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type Props = {
  requests: PremiumRequest[];
  stats: Stats;
};

function formatTanggal(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffJam = Math.floor(diffMs / 3600000);
    const diffHari = Math.floor(diffMs / 86400000);

    if (diffJam < 1) return "Baru saja";
    if (diffJam < 24) return `${diffJam} jam lalu`;
    if (diffHari < 7) return `${diffHari} hari lalu`;

    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTanggalLengkap(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminPremiumKlien({ requests, stats }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending"
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  async function handleApprove(id: string) {
    if (!confirm("Approve request ini? Premium akan aktif 1 tahun.")) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/premium/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }

      alert("✅ Approved! Premium user sudah aktif.");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal"));
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      alert("⚠️ Isi alasan penolakan");
      return;
    }

    setLoading(id);
    try {
      const res = await fetch(`/api/premium/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectReason.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }

      alert("❌ Request ditolak.");
      setShowReject(null);
      setRejectReason("");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Gagal"));
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus request ini permanen?")) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/premium/${id}`, { method: "DELETE" });
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
    <div className="space-y-5">
      {/* STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter("pending")}
          className={`rounded-2xl p-4 text-center transition ${
            filter === "pending"
              ? "bg-yellow-100 border-2 border-yellow-400 shadow-md"
              : "bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-300"
          }`}
        >
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-[10px] text-yellow-800 font-bold uppercase">
            Pending
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.pending}
          </div>
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`rounded-2xl p-4 text-center transition ${
            filter === "approved"
              ? "bg-green-100 border-2 border-green-400 shadow-md"
              : "bg-green-50 border-2 border-green-200 hover:border-green-300"
          }`}
        >
          <div className="text-2xl mb-1">✅</div>
          <div className="text-[10px] text-green-800 font-bold uppercase">
            Approved
          </div>
          <div className="text-2xl font-bold text-green-900">
            {stats.approved}
          </div>
        </button>

        <button
          onClick={() => setFilter("rejected")}
          className={`rounded-2xl p-4 text-center transition ${
            filter === "rejected"
              ? "bg-red-100 border-2 border-red-400 shadow-md"
              : "bg-red-50 border-2 border-red-200 hover:border-red-300"
          }`}
        >
          <div className="text-2xl mb-1">❌</div>
          <div className="text-[10px] text-red-800 font-bold uppercase">
            Rejected
          </div>
          <div className="text-2xl font-bold text-red-900">
            {stats.rejected}
          </div>
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`rounded-2xl p-4 text-center transition ${
            filter === "all"
              ? "bg-blue-100 border-2 border-blue-400 shadow-md"
              : "bg-blue-50 border-2 border-blue-200 hover:border-blue-300"
          }`}
        >
          <div className="text-2xl mb-1">📊</div>
          <div className="text-[10px] text-blue-800 font-bold uppercase">
            Semua
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 italic text-sm">
              Tidak ada request dengan status "{filter}"
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white border-2 rounded-2xl p-5 ${
                r.status === "pending"
                  ? "border-yellow-300"
                  : r.status === "approved"
                  ? "border-green-300"
                  : "border-red-300"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      r.status === "pending"
                        ? "bg-yellow-200 text-yellow-900"
                        : r.status === "approved"
                        ? "bg-green-200 text-green-900"
                        : "bg-red-200 text-red-900"
                    }`}
                  >
                    {r.status === "pending"
                      ? "⏳ PENDING"
                      : r.status === "approved"
                      ? "✅ APPROVED"
                      : "❌ REJECTED"}
                  </span>
                  <span className="text-xs text-gray-600">
                    {r.tipe === "social_media" ? "📱 Social Media" : "👥 Referral"}
                  </span>
                  {r.platform && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {r.platform}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs text-gray-500"
                  title={formatTanggalLengkap(r.created_at)}
                >
                  {formatTanggal(r.created_at)}
                </span>
              </div>

              {/* User ID (masked) */}
              <div className="text-[10px] text-gray-400 mb-2 font-mono">
                User: {r.user_id.substring(0, 8)}...
              </div>

              {/* Link post */}
              {r.link_post && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-gray-700 mb-1">
                    🔗 Link Postingan:
                  </div>
                  <a
                    href={r.link_post}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline break-all hover:text-blue-800"
                  >
                    {r.link_post}
                  </a>
                </div>
              )}

              {/* Screenshot */}
              {r.screenshot_url && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-gray-700 mb-1">
                    📸 Screenshot:
                  </div>
                  <a
                    href={r.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline break-all hover:text-blue-800"
                  >
                    {r.screenshot_url}
                  </a>
                </div>
              )}

              {/* Catatan user */}
              {r.catatan_user && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-gray-700 mb-1">
                    💬 Catatan User:
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {r.catatan_user}
                  </p>
                </div>
              )}

              {/* Rejection reason */}
              {r.status === "rejected" && r.rejection_reason && (
                <div className="mb-2 bg-red-50 border border-red-200 rounded p-2">
                  <div className="text-xs font-bold text-red-700 mb-1">
                    Alasan Ditolak:
                  </div>
                  <p className="text-xs text-red-600">{r.rejection_reason}</p>
                </div>
              )}

              {/* Action buttons (hanya pending) */}
              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={loading !== null}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition text-xs disabled:opacity-50"
                  >
                    {loading === r.id ? "⏳..." : "✅ Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setShowReject(r.id);
                      setRejectReason("");
                    }}
                    disabled={loading !== null}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition text-xs disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={loading !== null}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-lg transition text-xs disabled:opacity-50"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              )}

              {/* Delete untuk yang sudah processed */}
              {r.status !== "pending" && (
                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={loading !== null}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-2 rounded-lg transition text-xs disabled:opacity-50"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              )}

              {/* Modal reject */}
              {showReject === r.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs font-bold text-red-700 mb-2">
                    Alasan Penolakan (wajib):
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Screenshot tidak terlihat, like kurang dari 50, dsb."
                    rows={2}
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReject(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-xs"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={loading !== null}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50"
                    >
                      {loading === r.id ? "⏳..." : "Tolak Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
