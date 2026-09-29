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
  { id: "pending", label: "⏳ Belum Bayar" },
  { id: "approved", label: "✅ Diproses" },
  { id: "dikirim", label: "🚚 Dikirim" },
  { id: "selesai", label: "🎉 Selesai" },
  { id: "all", label: "📋 Semua" },
] as const;

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
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition ${
              tab === t.id
                ? "bg-green-700 text-white"
                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {t.label} ({tabCounts[t.id] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 italic text-sm mb-4">
            Belum ada pesanan
          </p>
          <Link
            href="/toko"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-2 rounded-lg"
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
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <Link
                      href={`/toko/pesanan/${o.order_code}`}
                      className="font-mono font-bold text-gray-900 text-sm hover:text-orange-600"
                    >
                      {o.order_code}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {formatTanggal(o.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 text-base">
                      {formatRp(o.total)}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                      {o.status}
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
                        className="border border-gray-100 rounded-lg p-2"
                      >
                        <div className="flex gap-2 items-center">
                          {item.foto_url && (
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.foto_url}
                                alt={item.nama_produk}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-gray-900 truncate">
                              {item.nama_produk}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {item.qty} {item.satuan} ·{" "}
                              {formatRp(item.subtotal)}
                            </div>
                          </div>
                        </div>

                        {/* Review section */}
                        {o.status === "selesai" && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            {reviewed && review ? (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-amber-500">
                                    {"⭐".repeat(review.rating)}
                                  </span>
                                  <span className="font-bold text-emerald-800">
                                    Sudah direview
                                  </span>
                                </div>
                                {review.komentar && (
                                  <p className="text-gray-700 italic">
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
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg"
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
                  className="block text-center text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                >
                  Lihat Detail →
                </Link>
              </div>
            );
          })}
        </div>
      )}

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            ⭐ Rating Produk
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="text-sm text-gray-700 mb-4 font-medium">
          {namaProduk}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-3">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating bintang */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Beri Rating
            </label>
            <div className="flex gap-2 justify-center text-5xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-transform hover:scale-110 ${
                    star <= rating ? "text-amber-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
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

          {/* Komentar */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Komentar (opsional)
            </label>
            <textarea
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Ceritakan pengalaman Anda dengan produk ini..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
            />
            <div className="text-[10px] text-gray-500 text-right mt-1">
              {komentar.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "⏳ Mengirim..." : "📤 Kirim Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
