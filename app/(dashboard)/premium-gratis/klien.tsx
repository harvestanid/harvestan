"use client";

import { useState } from "react";
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
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  requests: PremiumRequest[];
  hasPending: boolean;
  isPremiumActive: boolean;
};

const PLATFORM_OPTIONS = [
  { val: "instagram", label: "📷 Instagram" },
  { val: "tiktok", label: "🎵 TikTok" },
  { val: "facebook", label: "📘 Facebook" },
  { val: "x", label: "𝕏 X (Twitter)" },
  { val: "youtube", label: "📺 YouTube" },
  { val: "other", label: "🌐 Lainnya" },
];

function formatTanggal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PremiumGratisKlien({
  requests,
  hasPending,
  isPremiumActive,
}: Props) {
  const router = useRouter();

  const [tipe, setTipe] = useState<"social_media" | "referral">("social_media");
  const [platform, setPlatform] = useState("instagram");
  const [linkPost, setLinkPost] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [catatan, setCatatan] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tipe === "social_media" && !linkPost.trim() && !screenshotUrl.trim()) {
      setError("Isi minimal salah satu: link postingan atau URL screenshot");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/premium/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe,
          platform,
          link_post: linkPost.trim() || null,
          screenshot_url: screenshotUrl.trim() || null,
          catatan_user: catatan.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal submit");
        return;
      }

      setSukses(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError("Gagal submit: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  // Kalau sudah premium, tidak perlu form
  if (isPremiumActive) {
    return null;
  }

  // Kalau baru sukses submit
  if (sukses) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-emerald-900 mb-3">
          Request Terkirim!
        </h2>
        <p className="text-sm text-emerald-800 mb-4 leading-relaxed max-w-md mx-auto">
          Tim kami akan verifikasi dalam 1×24 jam. Anda akan dapat notifikasi
          lewat email setelah diverifikasi.
        </p>
        <p className="text-xs text-emerald-700 italic">
          Mohon tunggu. Jangan submit request duplikat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Kalau ada pending */}
      {hasPending && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">⏳</div>
            <div>
              <div className="font-bold text-amber-900 text-sm mb-1">
                Request Sedang Diverifikasi
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Anda sudah submit request. Tim kami akan verifikasi dalam 1×24
                jam. Tidak bisa submit lagi sampai request sebelumnya selesai
                diverifikasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {!hasPending && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5"
        >
          <div className="text-base font-bold text-gray-900 mb-2">
            📝 Form Pengajuan Premium Gratis
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Tipe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Pengajuan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipe("social_media")}
                className={`p-3 rounded-xl border-2 transition text-left ${
                  tipe === "social_media"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-sm">📱 Social Media</div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Post + min 50 like
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTipe("referral")}
                className={`p-3 rounded-xl border-2 transition text-left ${
                  tipe === "referral"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-sm">👥 Referral</div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Ajak 5 teman daftar
                </div>
              </button>
            </div>
          </div>

          {/* Platform */}
          {tipe === "social_media" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.val} value={p.val}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Postingan
                </label>
                <input
                  type="url"
                  value={linkPost}
                  onChange={(e) => setLinkPost(e.target.value)}
                  placeholder="https://instagram.com/p/xxxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Copy link postingan Anda (klik 3 titik → Copy Link)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Screenshot
                </label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://drive.google.com/xxxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Upload screenshot postingan ke Google Drive / Imgur (set
                  public), paste link di sini
                </p>
              </div>
            </>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Informasi tambahan untuk admin..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "⏳ Mengirim..." : "🎁 Ajukan Premium Gratis"}
          </button>
        </form>
      )}

      {/* Riwayat */}
      {requests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="font-bold text-gray-900 text-sm mb-4">
            📜 Riwayat Pengajuan ({requests.length})
          </div>

          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className={`border-2 rounded-xl p-4 ${
                  r.status === "approved"
                    ? "border-emerald-300 bg-emerald-50"
                    : r.status === "rejected"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {r.status === "approved"
                        ? "✅"
                        : r.status === "rejected"
                        ? "❌"
                        : "⏳"}
                    </span>
                    <span className="font-bold text-sm">
                      {r.status === "approved"
                        ? "Disetujui"
                        : r.status === "rejected"
                        ? "Ditolak"
                        : "Menunggu Verifikasi"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {formatTanggal(r.created_at)}
                  </span>
                </div>

                <div className="text-xs text-gray-700">
                  <strong>Tipe:</strong>{" "}
                  {r.tipe === "social_media" ? "Social Media" : "Referral"}
                  {r.platform && ` · ${r.platform}`}
                </div>

                {r.link_post && (
                  <div className="text-xs mt-1">
                    <a
                      href={r.link_post}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      {r.link_post}
                    </a>
                  </div>
                )}

                {r.status === "rejected" && r.rejection_reason && (
                  <div className="mt-2 p-2 bg-white rounded text-xs text-red-700 border border-red-200">
                    <strong>Alasan:</strong> {r.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
