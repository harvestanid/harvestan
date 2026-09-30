"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

function hitungCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "KADALUARSA";
  const totalSec = Math.floor(diff / 1000);
  const jam = Math.floor(totalSec / 3600);
  const menit = Math.floor((totalSec % 3600) / 60);
  const detik = totalSec % 60;
  return `${String(jam).padStart(2, "0")}:${String(menit).padStart(
    2,
    "0"
  )}:${String(detik).padStart(2, "0")}`;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState(hitungCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(hitungCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = countdown === "KADALUARSA";

  return (
    <span
      className={`font-mono font-bold ${
        isExpired ? "text-red-600" : "text-[#2c5e2e]"
      }`}
    >
      ⏰ {countdown}
    </span>
  );
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl shadow-[#2c5e2e]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f0b429]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a8f3f]/30 rounded-full blur-3xl" />

        <div className="relative">
          <div className="text-6xl md:text-7xl mb-4">💎</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tighter">
            Anda Sudah Premium!
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Nikmati semua fitur Harvestan tanpa batasan.
          </p>
          {status.expiresAt ? (
            <div className="inline-block bg-white/10 backdrop-blur border border-white/20 rounded-full px-5 py-2 text-xs text-[#f0b429] font-medium">
              Aktif sampai:{" "}
              {new Date(status.expiresAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {status.daysRemaining !== null &&
                ` (${status.daysRemaining} hari lagi)`}
            </div>
          ) : (
            <div className="inline-block bg-white/10 backdrop-blur border border-white/20 rounded-full px-5 py-2 text-xs text-[#f0b429] font-medium">
              ✨ Akses selamanya — tanpa batas waktu
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* ===== HERO PRICING ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-[#2c5e2e]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f0b429]/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a8f3f]/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative text-center">
          <div className="inline-block bg-[#f0b429]/20 backdrop-blur border border-[#f0b429]/40 rounded-full px-4 py-1.5 text-[10px] font-bold mb-4 uppercase tracking-[0.25em] text-[#f0b429]">
            💥 Sekali Bayar · Akses Selamanya
          </div>
          <div className="text-5xl md:text-6xl font-bold mb-2 tracking-tighter">
            {formatRp(paymentInfo.harga)}
          </div>
          <div className="text-sm text-white/70 line-through mb-3">
            Rp 199.000
          </div>
          <div className="text-xs text-[#f0b429] font-bold uppercase tracking-widest">
            Hemat 70% — promo terbatas
          </div>
        </div>
      </div>

      {/* ===== INVOICE AKTIF atau GENERATE ===== */}
      {invoice && invoice.status === "pending" ? (
        <div className="bg-white rounded-3xl border-2 border-[#f0b429] p-6 shadow-2xl shadow-[#f0b429]/20">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f0b429]/15 flex items-center justify-center text-2xl">
                🧾
              </div>
              <div>
                <div className="text-[10px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest">
                  Invoice Aktif
                </div>
                <div className="font-bold text-[#2c5e2e] text-base font-mono tracking-tight">
                  {invoice.invoice_code}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#2c5e2e]/60 mb-1 uppercase tracking-widest font-bold">
                Berlaku
              </div>
              <CountdownTimer expiresAt={invoice.expires_at} />
              <div className="text-[10px] text-[#2c5e2e]/40 mt-1">
                {formatTanggalJam(invoice.expires_at)}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#faf9f5] to-[#f0b429]/10 border border-[#f0b429]/30 rounded-2xl p-4 mb-5">
            <div className="text-[10px] text-[#2c5e2e] font-bold uppercase tracking-widest mb-3">
              💳 Transfer ke rekening berikut
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2c5e2e]/70">Bank</span>
                <span className="font-bold text-[#2c5e2e]">
                  {paymentInfo.bank}
                </span>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm text-[#2c5e2e]/70">
                  Nomor Rekening
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#2c5e2e] text-lg tracking-tight">
                    {paymentInfo.nomor_rekening}
                  </span>
                  <button
                    onClick={handleCopyRekening}
                    className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2c5e2e]/70">Atas Nama</span>
                <span className="font-bold text-[#2c5e2e]">
                  {paymentInfo.nama_pemilik}
                </span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-[#f0b429]/30 pt-3 mt-3">
                <span className="text-sm text-[#2c5e2e] font-bold uppercase tracking-widest">
                  Nominal Transfer
                </span>
                <span className="font-bold text-[#f0b429] text-xl tracking-tight">
                  {formatRp(invoice.nominal)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-5 text-xs text-blue-800 leading-relaxed">
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
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] text-base flex items-center justify-center gap-2"
          >
            📱 Kirim Bukti Transfer via WhatsApp
          </button>

          <div className="text-center text-[10px] text-[#2c5e2e]/40 mt-3 uppercase tracking-widest font-bold">
            Admin: {paymentInfo.whatsapp_display}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-[#f0b429] p-6 md:p-8 shadow-2xl shadow-[#f0b429]/20 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-[#f0b429]/15 flex items-center justify-center text-4xl">
            🏦
          </div>
          <h3 className="font-bold text-[#2c5e2e] text-lg mb-2 tracking-tight">
            Bayar via Transfer Bank
          </h3>
          <p className="text-sm text-[#2c5e2e]/70 mb-6 leading-relaxed max-w-md mx-auto">
            Klik tombol di bawah untuk generate invoice. Invoice berlaku{" "}
            <strong>24 jam</strong> sejak dibuat.
          </p>
          <button
            onClick={handleBuatInvoice}
            disabled={loading}
            className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:shadow-[#2c5e2e]/40 hover:scale-[1.02] disabled:opacity-50 text-base"
          >
            {loading ? "⏳ Membuat Invoice..." : "🧾 Buat Invoice Sekarang"}
          </button>
          <p className="text-xs text-[#2c5e2e]/50 mt-4">
            Setelah transfer, kirim bukti via WhatsApp ke admin
          </p>

          <Link
            href="/premium/riwayat"
            className="inline-block mt-5 text-xs text-[#2c5e2e] hover:text-[#f0b429] underline font-bold transition"
          >
            📜 Lihat Riwayat Invoice
          </Link>
        </div>
      )}

      {/* ===== MAYAR (HIDDEN) ===== */}
      <div className="bg-[#faf9f5] border-2 border-[#2c5e2e]/10 rounded-3xl p-5">
        <button
          onClick={() => setShowMayar(!showMayar)}
          className="w-full flex items-center justify-between text-sm text-[#2c5e2e]/70 hover:text-[#2c5e2e] transition"
        >
          <span className="font-bold uppercase tracking-widest text-xs">
            💡 Metode pembayaran lain (QRIS)
          </span>
          <span className="text-lg">{showMayar ? "▲" : "▼"}</span>
        </button>
        {showMayar && (
          <div className="mt-4 pt-4 border-t border-[#2c5e2e]/10">
            <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/30 rounded-2xl p-4 text-xs text-[#2c5e2e] leading-relaxed">
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

      {/* ===== PERBANDINGAN ===== */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🆓</span>
            <h3 className="font-bold text-lg text-[#2c5e2e] tracking-tight">
              Gratis
            </h3>
          </div>
          <div className="text-3xl font-bold text-[#2c5e2e] mb-5 tracking-tighter">
            Rp 0
          </div>
          <ul className="space-y-2.5">
            {FITUR_GRATIS.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[#2c5e2e]/70"
              >
                <span className="flex-shrink-0">{f.icon}</span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-xs text-[#2c5e2e]/50 italic">
            Cukup untuk coba-coba
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#f0b429]/15 to-[#f0b429]/5 border-2 border-[#f0b429] rounded-3xl p-6 shadow-2xl shadow-[#f0b429]/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f0b429] text-[#2c5e2e] text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-widest">
            ⭐ Paling Worth It
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💎</span>
            <h3 className="font-bold text-lg text-[#2c5e2e] tracking-tight">
              Premium
            </h3>
          </div>
          <div className="text-3xl font-bold text-[#2c5e2e] mb-5 tracking-tighter">
            {formatRp(paymentInfo.harga)}
            <span className="text-xs font-normal text-[#2c5e2e]/70 ml-2">
              sekali bayar
            </span>
          </div>
          <ul className="space-y-2.5">
            {FITUR_PREMIUM.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[#2c5e2e] font-medium"
              >
                <span className="flex-shrink-0">{f.icon}</span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-xs text-[#2c5e2e] italic font-bold">
            ✅ Semua fitur, tanpa batas, selamanya
          </div>
        </div>
      </div>

      {/* ===== RIWAYAT ===== */}
      {riwayatInvoice.length > 0 && (
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
              📜 Riwayat Invoice ({riwayatInvoice.length})
            </h3>
            <Link
              href="/premium/riwayat"
              className="text-xs text-[#2c5e2e] hover:text-[#f0b429] underline font-bold transition"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            {riwayatInvoice.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                className={`border-2 rounded-2xl p-3.5 text-xs ${
                  inv.status === "approved"
                    ? "border-[#2c5e2e]/30 bg-[#2c5e2e]/5"
                    : inv.status === "rejected"
                    ? "border-red-300 bg-red-50"
                    : inv.status === "expired"
                    ? "border-gray-300 bg-gray-50"
                    : "border-[#f0b429]/60 bg-[#f0b429]/10"
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
                    <span className="font-mono font-bold text-[#2c5e2e]">
                      {inv.invoice_code}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#2c5e2e]/60">
                    {formatTanggalJam(inv.created_at)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[#2c5e2e]/70 font-medium">
                    {formatRp(inv.nominal)}
                  </span>
                  <span
                    className={`font-bold ${
                      inv.status === "approved"
                        ? "text-[#2c5e2e]"
                        : inv.status === "rejected"
                        ? "text-red-700"
                        : inv.status === "expired"
                        ? "text-gray-500"
                        : "text-[#f0b429]"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-6">
        <h3 className="font-bold text-[#2c5e2e] mb-5 uppercase tracking-widest text-xs">
          ❓ Pertanyaan Umum
        </h3>
        <div className="space-y-5">
          <div>
            <div className="font-bold text-sm text-[#2c5e2e] mb-1.5">
              Bayar sekali, beneran selamanya?
            </div>
            <p className="text-xs text-[#2c5e2e]/70 leading-relaxed">
              Ya. Tidak ada langganan bulanan. Setelah bayar{" "}
              {formatRp(paymentInfo.harga)}, akun Anda jadi Premium permanen.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-[#2c5e2e] mb-1.5">
              Kenapa harus generate invoice dulu?
            </div>
            <p className="text-xs text-[#2c5e2e]/70 leading-relaxed">
              Supaya admin bisa lacak pembayaran dan cocokkan dengan transfer
              Anda. Invoice berlaku 24 jam — kalau kadaluarsa, generate ulang.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-[#2c5e2e] mb-1.5">
              Berapa lama aktivasi setelah kirim bukti?
            </div>
            <p className="text-xs text-[#2c5e2e]/70 leading-relaxed">
              Maksimal 1×24 jam. Biasanya lebih cepat, tergantung admin
              online.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-[#2c5e2e] mb-1.5">
              Ada cara lain dapat Premium gratis?
            </div>
            <p className="text-xs text-[#2c5e2e]/70 leading-relaxed">
              Ada! Lihat{" "}
              <Link
                href="/premium-gratis"
                className="text-[#f0b429] underline font-bold hover:text-[#e6a617]"
              >
                Premium Gratis via barter
              </Link>{" "}
              — bantu promosikan Harvestan, dapat Premium 1 tahun.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#2c5e2e]/50 leading-relaxed pb-4">
        Dengan melanjutkan, Anda menyetujui{" "}
        <span className="text-[#2c5e2e] font-bold">Syarat & Ketentuan</span>{" "}
        Harvestan.
      </div>
    </div>
  );
}
