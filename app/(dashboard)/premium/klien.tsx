"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionStatus } from "@/lib/supabase/queries/subscription-server";

type Props = {
  status: SubscriptionStatus;
};

const FITUR_PREMIUM = [
  { icon: "♾️", label: "Unlimited penggarap, lahan & panen" },
  { icon: "📄", label: "Export PDF invoice & laporan" },
  { icon: "📊", label: "Export Excel lengkap + backup" },
  { icon: "📥", label: "Import backup antar akun" },
  { icon: "🗺️", label: "GPS walking ukur lahan + polygon" },
  { icon: "⚖️", label: "Penimbangan gabah multi-sesi" },
  { icon: "🌶️", label: "Panen bertahap cabai per musim" },
  { icon: "📈", label: "Grafik & laporan multi-komoditas" },
  { icon: "🔄", label: "Update fitur baru selamanya" },
];

const FITUR_GRATIS = [
  { icon: "👨‍🌾", label: "Max 2 penggarap" },
  { icon: "🗺️", label: "Max 2 lahan" },
  { icon: "🌾", label: "Max 2 panen" },
  { icon: "📊", label: "Dashboard & keuangan dasar" },
  { icon: "💬", label: "Feedback & bantuan" },
];

export function PremiumKlien({ status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPremiumActive = status.isPremium && status.isActive;

  async function handleBayar() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/mayar/create", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal buat QRIS");
        setLoading(false);
        return;
      }

      if (!json.payment_url) {
        setError("Mayar tidak mengembalikan URL pembayaran");
        setLoading(false);
        return;
      }

      // Redirect ke halaman pembayaran Mayar (QRIS)
      window.location.href = json.payment_url;
    } catch (err: any) {
      setError("Terjadi kesalahan: " + (err.message || "Unknown"));
      setLoading(false);
    }
  }

  if (isPremiumActive) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center shadow-2xl">
        <div className="text-6xl mb-4">💎</div>
        <h2 className="text-2xl font-bold mb-2">Anda Sudah Premium!</h2>
        <p className="text-emerald-50 text-sm mb-1">
          Nikmati semua fitur Harvestan tanpa batasan.
        </p>
        {status.expiresAt && (
          <p className="text-emerald-100 text-xs mt-3">
            Aktif sampai:{" "}
            {new Date(status.expiresAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {status.daysRemaining !== null &&
              ` (${status.daysRemaining} hari lagi)`}
          </p>
        )}
        {!status.expiresAt && (
          <p className="text-emerald-100 text-xs mt-3">
            ✨ Akses selamanya — tanpa batas waktu
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* HERO PRICING */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-2xl mb-6">
        <div className="text-center">
          <div className="inline-block bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold mb-3">
            💥 SEKALI BAYAR · AKSES SELAMANYA
          </div>
          <div className="text-5xl md:text-6xl font-bold mb-2">Rp 59.000</div>
          <div className="text-sm text-white/90 line-through">
            Rp 199.000
          </div>
          <div className="text-xs text-white/95 mt-2">
            Hemat 70% — harga promo terbatas
          </div>
        </div>

        <button
          onClick={handleBayar}
          disabled={loading}
          className="w-full mt-6 bg-white text-orange-600 font-bold py-4 rounded-xl hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
        >
          {loading ? "⏳ Memproses..." : "📱 Bayar via QRIS"}
        </button>

        <p className="text-center text-xs text-white/80 mt-3">
          🔒 Aman via Mayar · Scan QRIS dengan aplikasi bank/e-wallet apapun
        </p>
        <p className="text-center text-[10px] text-white/70 mt-1">
          BCA · Mandiri · BRI · BNI · GoPay · OVO · DANA · ShopeePay · LinkAja
        </p>
      </div>

      {/* PERBANDINGAN */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🆓</span>
            <h3 className="font-bold text-lg text-gray-900">Gratis</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-4">Rp 0</div>
          <ul className="space-y-2">
            {FITUR_GRATIS.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="flex-shrink-0">{f.icon}</span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-gray-500 italic">
            Cukup untuk coba-coba
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-400 rounded-2xl p-5 relative shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
            ⭐ PALING WORTH IT
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💎</span>
            <h3 className="font-bold text-lg text-orange-900">Premium</h3>
          </div>
          <div className="text-2xl font-bold text-orange-900 mb-4">
            Rp 59.000
            <span className="text-xs font-normal text-orange-700 ml-1">
              sekali bayar
            </span>
          </div>
          <ul className="space-y-2">
            {FITUR_PREMIUM.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-orange-900 font-medium"
              >
                <span className="flex-shrink-0">{f.icon}</span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-orange-700 italic">
            ✅ Semua fitur, tanpa batas, selamanya
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">❓ Pertanyaan Umum</h3>
        <div className="space-y-3">
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Bayar sekali, beneran selamanya?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ya. Tidak ada langganan bulanan. Setelah bayar Rp 59.000, akun
              Anda jadi Premium permanen.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Metode pembayaran apa saja?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              QRIS — bisa dibayar dengan semua aplikasi bank dan e-wallet
              Indonesia: BCA Mobile, Livin Mandiri, BRImo, BNI Mobile,
              GoPay, OVO, DANA, ShopeePay, LinkAja, dll.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Bisa refund?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Karena produk digital dan langsung aktif, tidak ada refund.
              Pastikan sudah coba versi gratis & demo sebelum upgrade.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Ada cara lain dapat Premium gratis?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ada! Lihat{" "}
              <a
                href="/premium-gratis"
                className="text-emerald-700 underline font-medium"
              >
                Premium Gratis via barter
              </a>{" "}
              — bantu promosikan Harvestan, dapat Premium 1 tahun.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 leading-relaxed">
        Dengan melanjutkan, Anda menyetujui{" "}
        <span className="text-emerald-700 font-medium">
          Syarat & Ketentuan
        </span>{" "}
        Harvestan.
      </div>
    </>
  );
}
