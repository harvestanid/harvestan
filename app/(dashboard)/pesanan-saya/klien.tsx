"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/supabase/queries/subscription-server";

type Review = {
  order_id: string;
  product_id: string;
  rating: number;
  komentar: string | null;
  created_at: string;
};

type Props = {
  orders: Order[];
  reviews: Review[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_TABS = [
  { id: "all", label: "📋 Semua", color: "bg-[#2c5e2e]" },
  { id: "pending", label: "⏳ Belum Bayar", color: "bg-[#f0b429]" },
  { id: "approved", label: "✅ Diproses", color: "bg-blue-500" },
  { id: "dikirim", label: "🚚 Dikirim", color: "bg-purple-500" },
  { id: "selesai", label: "🎉 Selesai", color: "bg-[#2c5e2e]" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Belum Bayar",
  approved: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  rejected: "Ditolak",
  expired: "Kadaluarsa",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#f0b429] text-[#2c5e2e]",
  approved: "bg-blue-500 text-white",
  dikirim: "bg-purple-500 text-white",
  selesai: "bg-[#2c5e2e] text-white",
  rejected: "bg-red-500 text-white",
  expired: "bg-gray-400 text-white",
};

export function PesananSayaKlien({ orders, reviews }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("all");
  const [reviewModal, setReviewModal] = useState<{
    order_id: string;
    product_id: string;
    nama_produk: string;
  } | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  function sudahReview(orderId: string, productId: string): boolean {
    return reviews.some(
      (r) => r.order_id === orderId && r.product_id === productId
    );
  }

  function getReview(
    orderId: string,
    productId: string
  ): Review | undefined {
    return reviews.find(
      (r) => r.order_id === orderId && r.product_id === productId
    );
  }

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    ["pending", "approved", "dikirim", "selesai"].forEach((s) => {
      counts[s] = orders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [orders]);

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-[#2c5e2e]/30 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-block bg-[#f0b429]/20 border border-[#f0b429]/40 rounded-full px-3 py-1.5 text-[10px] font-bold mb-3 uppercase tracking-[0.25em] text-[#f0b429]">
            📦 Pesanan Saya
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">
            Riwayat Pembelian
          </h1>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
            Lihat semua pesanan Anda + kasih rating produk setelah diterima.
          </p>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-1 px-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
              tab === t.id
                ? `${t.color} text-white shadow-lg scale-105`
                : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
            }`}
          >
            {t.label} ({tabCounts[t.id] || 0})
          </button>
        ))}
      </div>

      {/* ===== LIST ===== */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/15 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-[#2c5e2e]/60 italic text-sm mb-5">
            Belum ada pesanan
          </p>
          <Link
            href="/toko"
            className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-sm font-bold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-lg shadow-[#2c5e2e]/20"
          >
            🛒 Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const items = o.items || [];

            return (
              <div
                key={o.id}
                className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 md:p-5 shadow-lg shadow-[#2c5e2e]/5"
              >
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <Link
                      href={`/toko/pesanan/${o.order_code}`}
                      className="font-mono font-bold text-[#2c5e2e] text-sm hover:text-[#f0b429] transition-colors"
                    >
                      {o.order_code}
                    </Link>
                    <div className="text-[10px] text-[#2c5e2e]/60 mt-1">
                      {formatTanggal(o.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#2c5e2e] text-base tracking-tight">
                      {formatRp(o.total)}
                    </div>
                    <div
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest inline-block mt-1 ${
                        STATUS_COLOR[o.status] || "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {STATUS_LABEL[o.status] || o.status}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {items.map((item, i) => {
                    const reviewed = sudahReview(o.id, item.product_id);
                    const review = getReview(o.id, item.product_id);

                    return (
                      <div
                        key={i}
                        className="border-2 border-[#2c5e2e]/10 rounded-2xl p-3 bg-[#faf9f5]"
                      >
                        <div className="flex gap-3 items-center">
                          {item.foto_url && (
                            <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-[#2c5e2e]/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.foto_url}
                                alt={item.nama_produk}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#2c5e2e] text-xs truncate tracking-tight">
                              {item.nama_produk}
                            </div>
                            <div className="text-[10px] text-[#2c5e2e]/60 mt-0.5">
                              {item.qty} {item.satuan} ·{" "}
                              {formatRp(item.subtotal)}
                            </div>
                          </div>
                        </div>

                        {/* Review section */}
                        {o.status === "selesai" && (
                          <div className="mt-3 pt-3 border-t border-[#2c5e2e]/10">
                            {reviewed && review ? (
                              <div className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/20 rounded-2xl p-3 text-xs">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[#f0b429] text-base">
                                    {"★".repeat(review.rating)}
                                    {"☆".repeat(5 - review.rating)}
                                  </span>
                                  <span className="font-bold text-[#2c5e2e] uppercase tracking-widest text-[10px]">
                                    Sudah Direview
                                  </span>
                                </div>
                                {review.komentar && (
                                  <p className="text-[#2c5e2e]/70 italic text-xs leading-relaxed">
                                    &ldquo;{review.komentar}&rdquo;
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    order_id: o.id,
                                    product_id: item.product_id,
                                    nama_produk: item.nama_produk,
                                  })
                                }
                                className="w-full bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] text-xs font-bold py-2.5 rounded-full transition-all hover:scale-[1.02] shadow-md"
                              >
                                ⭐ Kasih Rating & Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={`/toko/pesanan/${o.order_code}`}
                  className="block text-center text-xs text-[#2c5e2e] hover:text-[#f0b429] underline font-bold transition-colors"
                >
                  Lihat Detail →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== REVIEW MODAL ===== */}
      {reviewModal && (
        <ReviewModal
          orderId={reviewModal.order_id}
          productId={reviewModal.product_id}
          namaProduk={reviewModal.nama_produk}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            setReviewModal(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ===================================================
// REVIEW MODAL
// ===================================================
function ReviewModal({
  orderId,
  productId,
  namaProduk,
  onClose,
  onSuccess,
}: {
  orderId: string;
  productId: string;
  namaProduk: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/review/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          rating,
          komentar,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal kirim review");
        return;
      }
      alert("✅ Review terkirim! Terima kasih 🙏");
      onSuccess();
    } catch (err: any) {
      setError("Error: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2c5e2e]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border-2 border-[#f0b429]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f0b429]/20 flex items-center justify-center text-xl">
              ⭐
            </div>
            <h2 className="text-lg font-bold text-[#2c5e2e] tracking-tight">
              Rating Produk
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#2c5e2e]/40 hover:text-[#2c5e2e] text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="text-sm text-[#2c5e2e] mb-5 font-bold bg-[#faf9f5] rounded-2xl p-3 border border-[#2c5e2e]/10">
          {namaProduk}
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 text-sm text-red-700 mb-4">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-3">
              Beri Rating
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-5xl transition-all hover:scale-125 ${
                    star <= rating ? "text-[#f0b429]" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-[#2c5e2e]/60 mt-3 font-bold">
              {rating === 5
                ? "Sangat Puas 😍"
                : rating === 4
                ? "Puas 😊"
                : rating === 3
                ? "Cukup 😐"
                : rating === 2
                ? "Kurang 😕"
                : "Kecewa 😞"}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              Komentar (opsional)
            </label>
            <textarea
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Ceritakan pengalaman Anda dengan produk ini..."
              rows={4}
              maxLength={500}
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e] resize-y"
            />
            <div className="text-[10px] text-[#2c5e2e]/50 text-right mt-1.5 font-bold">
              {komentar.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-sm uppercase tracking-widest"
          >
            {loading ? "⏳ Mengirim..." : "📤 Kirim Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
