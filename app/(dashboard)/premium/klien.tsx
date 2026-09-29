"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SubscriptionStatus,
  Invoice,
} from "@/lib/supabase/queries/subscription-server";

type Props = {
  status: SubscriptionStatus;
  activeInvoice: Invoice | null;
  riwayatInvoice: Invoice[];
  paymentInfo: {
    bank: string;
    nomor_rekening: string;
    nama_pemilik: string;
    whatsapp: string;
    whatsapp_display: string;
    harga: number;
  };
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

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggalJam(iso: string): string {
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

function hitungSisaJam(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

export function PremiumKlien({
  status,
  activeInvoice,
  riwayatInvoice,
  paymentInfo,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(activeInvoice);
  const [showMayar, setShowMayar] = useState(false);

  const isPremiumActive = status.isPremium && status.isActive;

  async function handleBuatInvoice() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/invoice/create", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal membuat invoice");
        setLoading(false);
        return;
      }

      setInvoice(json.invoice);
      router.refresh();
    } catch (err: any) {
      setError("Terjadi kesalahan: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  function handleCopyRekening() {
    const text = `${paymentInfo.nomor_rekening}`;
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("✅ Nomor rekening disalin: " + text))
        .catch(() => alert("❌ Gagal menyalin"));
    } else {
      alert("Nomor rekening: " + text);
    }
  }

  function handleKirimWhatsApp() {
    if (!invoice) return;
    const pesan = `Halo Admin Harvestan,

Saya mau upgrade ke Premium.

🧾 Invoice: ${invoice.invoice_code}
👤 Nama: ${invoice.user_nama}
📧 Email: ${invoice.user_email}
💰 Nominal: ${formatRp(invoice.nominal)}

Saya sudah transfer, berikut bukti transfernya 👇

(Mohon lampirkan screenshot bukti transfer di chat ini)`;

    const url = `https://wa.me/${paymentInfo.whatsapp}?text=${encodeURIComponent(
      pesan
    )}`;
    window.open(url, "_blank");
  }

  if (isPremiumActive) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white text-center shadow-2xl">
        <div className="text-6xl mb-4">💎</div>
        <h2 className="text-2xl font-bold mb-2">Anda Sudah Premium!</h2>
        <p className="text-emerald-50 text-sm mb-1">
          Nikmati semua fitur Harvestan tanpa batasan.
        </p>
        {status.expiresAt ? (
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
        ) : (
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

      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-2xl mb-6">
        <div className="text-center">
          <div className="inline-block bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold mb-3">
            💥 SEKALI BAYAR · AKSES SELAMANYA
          </div>
          <div className="text-5xl md:text-6xl font-bold mb-2">
            {formatRp(paymentInfo.harga)}
          </div>
          <div className="text-sm text-white/90 line-through">
            Rp 199.000
          </div>
          <div className="text-xs text-white/95 mt-2">
            Hemat 70% — harga promo terbatas
          </div>
        </div>
      </div>

      {invoice && invoice.status === "pending" ? (
        <div className="bg-white border-2 border-orange-400 rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧾</span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  INVOICE AKTIF
                </div>
                <div className="font-bold text-gray-900 text-lg font-mono">
                  {invoice.invoice_code}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Berlaku sampai</div>
              <div className="font-bold text-orange-600 text-sm">
                ⏰ {hitungSisaJam(invoice.expires_at)} jam lagi
              </div>
              <div className="text-[10px] text-gray-400">
                {formatTanggalJam(invoice.expires_at)}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="text-xs text-orange-700 font-bold uppercase mb-2">
              💳 Transfer ke rekening berikut:
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bank</span>
                <span className="font-bold text-gray-900">
                  {paymentInfo.bank}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900 text-lg">
                    {paymentInfo.nomor_rekening}
                  </span>
                  <button
                    onClick={handleCopyRekening}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded transition"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Atas Nama</span>
                <span className="font-bold text-gray-900">
                  {paymentInfo.nama_pemilik}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-orange-200 pt-2 mt-2">
                <span className="text-sm text-gray-600 font-bold">
                  Nominal Transfer
                </span>
                <span className="font-bold text-orange-700 text-xl">
                  {formatRp(invoice.nominal)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 leading-relaxed">
            <strong>📌 Cara Bayar:</strong>
            <br />
            1. Transfer tepat{" "}
            <strong>{formatRp(invoice.nominal)}</strong> ke rekening di atas
            <br />
            2. Screenshot bukti transfer
            <br />
            3. Klik tombol WhatsApp di bawah, lampirkan screenshot
            <br />
            4. Tunggu konfirmasi admin (1×24 jam)
          </div>

          <button
            onClick={handleKirimWhatsApp}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-base flex items-center justify-center gap-2"
          >
            📱 Kirim Bukti Transfer via WhatsApp
          </button>

          <div className="text-center text-[10px] text-gray-400 mt-3">
            Admin: {paymentInfo.whatsapp_display}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-orange-400 rounded-3xl p-6 mb-6 shadow-lg text-center">
          <div className="text-4xl mb-3">🏦</div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            Bayar via Transfer Bank
          </h3>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed max-w-md mx-auto">
            Klik tombol di bawah untuk generate invoice. Invoice berlaku{" "}
            <strong>24 jam</strong> sejak dibuat.
          </p>
          <button
            onClick={handleBuatInvoice}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 text-base"
          >
            {loading ? "⏳ Membuat Invoice..." : "🧾 Buat Invoice Sekarang"}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Setelah transfer, kirim bukti via WhatsApp ke admin
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
        <button
          onClick={() => setShowMayar(!showMayar)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="font-medium">
            💡 Metode pembayaran lain (QRIS)
          </span>
          <span>{showMayar ? "▲" : "▼"}</span>
        </button>
        {showMayar && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
              <strong>⚠️ Sedang dalam perbaikan</strong>
              <br />
              Metode pembayaran otomatis via QRIS sedang dalam proses
              aktivasi. Untuk sementara, silakan gunakan{" "}
              <strong>Transfer Bank</strong> di atas.
              <br />
              <br />
              Kami akan mengaktifkan QRIS segera setelah verifikasi selesai.
            </div>
          </div>
        )}
      </div>

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
            {formatRp(paymentInfo.harga)}
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

      {riwayatInvoice.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">
            📜 Riwayat Invoice ({riwayatInvoice.length})
          </h3>
          <div className="space-y-2">
            {riwayatInvoice.map((inv) => (
              <div
                key={inv.id}
                className={`border rounded-xl p-3 text-xs ${
                  inv.status === "approved"
                    ? "border-emerald-300 bg-emerald-50"
                    : inv.status === "rejected"
                    ? "border-red-300 bg-red-50"
                    : inv.status === "expired"
                    ? "border-gray-300 bg-gray-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {inv.status === "approved"
                        ? "✅"
                        : inv.status === "rejected"
                        ? "❌"
                        : inv.status === "expired"
                        ? "⏰"
                        : "⏳"}
                    </span>
                    <span className="font-mono font-bold">
                      {inv.invoice_code}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {formatTanggalJam(inv.created_at)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-gray-700">
                    {formatRp(inv.nominal)}
                  </span>
                  <span
                    className={`font-bold ${
                      inv.status === "approved"
                        ? "text-emerald-700"
                        : inv.status === "rejected"
                        ? "text-red-700"
                        : inv.status === "expired"
                        ? "text-gray-500"
                        : "text-amber-700"
                    }`}
                  >
                    {inv.status === "approved"
                      ? "Disetujui"
                      : inv.status === "rejected"
                      ? "Ditolak"
                      : inv.status === "expired"
                      ? "Kadaluarsa"
                      : "Menunggu"}
                  </span>
                </div>
                {inv.status === "rejected" && inv.catatan && (
                  <div className="mt-2 p-2 bg-white rounded text-red-700 border border-red-200">
                    <strong>Alasan:</strong> {inv.catatan}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">❓ Pertanyaan Umum</h3>
        <div className="space-y-3">
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Bayar sekali, beneran selamanya?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ya. Tidak ada langganan bulanan. Setelah bayar{" "}
              {formatRp(paymentInfo.harga)}, akun Anda jadi Premium permanen.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Kenapa harus generate invoice dulu?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Supaya admin bisa lacak pembayaran dan cocokkan dengan transfer
              Anda. Invoice berlaku 24 jam — kalau kadaluarsa, generate ulang.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 mb-1">
              Berapa lama aktivasi setelah kirim bukti?
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Maksimal 1×24 jam. Biasanya lebih cepat, tergantung admin online.
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
