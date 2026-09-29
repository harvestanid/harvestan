"use client";

import { useState, useEffect } from "react";

type Props = {
  order: any;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggalJam(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [t, setT] = useState(hitungCountdown(expiresAt));
  useEffect(() => {
    const i = setInterval(() => setT(hitungCountdown(expiresAt)), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);
  return (
    <span className="font-mono font-bold text-orange-600">⏰ {t}</span>
  );
}

const PAYMENT_INFO = {
  bank: "BCA",
  nomor_rekening: "8691873790",
  nama_pemilik: "Irsyaadul Ibaad",
  whatsapp: "6285162661397",
  whatsapp_display: "085162661397",
};

export function InvoicePesanan({ order }: Props) {
  const items = order.items || [];
  const isPending = order.status === "pending";

  function handleCopyRekening() {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(PAYMENT_INFO.nomor_rekening)
        .then(() =>
          alert("✅ Nomor rekening disalin: " + PAYMENT_INFO.nomor_rekening)
        )
        .catch(() => alert("❌ Gagal menyalin"));
    }
  }

  function handleKirimWA() {
    const pesan = `Halo Admin Harvestan,

Saya mau konfirmasi pembayaran pesanan.

🧾 Kode Pesanan: ${order.order_code}
👤 Nama: ${order.user_nama}
💰 Total: ${formatRp(order.total)}

Berikut bukti transfer saya 👇

(Mohon lampirkan screenshot bukti transfer)`;

    window.open(
      `https://wa.me/${PAYMENT_INFO.whatsapp}?text=${encodeURIComponent(
        pesan
      )}`,
      "_blank"
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "⏳ Menunggu Pembayaran",
    approved: "✅ Disetujui — Sedang Dikemas",
    rejected: "❌ Ditolak",
    expired: "⏰ Kadaluarsa",
    dikirim: "🚚 Sedang Dikirim",
    selesai: "🎉 Selesai",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    expired: "bg-gray-100 text-gray-700 border-gray-300",
    dikirim: "bg-blue-100 text-blue-800 border-blue-300",
    selesai: "bg-green-100 text-green-800 border-green-300",
  };

  return (
    <>
      {/* Status */}
      <div
        className={`border-2 rounded-2xl p-4 mt-4 mb-4 ${
          statusColor[order.status] || "bg-gray-100"
        }`}
      >
        <div className="text-xs font-bold uppercase opacity-70">
          Status Pesanan
        </div>
        <div className="text-xl font-bold mt-1">
          {statusLabel[order.status] || order.status}
        </div>
        {isPending && (
          <div className="text-sm mt-2">
            Selesaikan pembayaran dalam <Countdown expiresAt={order.expires_at} />
          </div>
        )}
      </div>

      {/* Info Order */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="text-xs text-gray-500">Kode Pesanan</div>
            <div className="font-mono font-bold text-gray-900 text-lg">
              {order.order_code}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Tanggal</div>
            <div className="text-xs font-medium text-gray-900">
              {formatTanggalJam(order.created_at)}
            </div>
          </div>
        </div>

        {order.resi && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-blue-800">
              🚚 Nomor Resi
            </div>
            <div className="font-mono font-bold text-blue-900 text-lg mt-1">
              {order.resi}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Kurir: {order.kurir_resi || order.kurir || "-"}
            </div>
          </div>
        )}

        {order.status === "rejected" && order.catatan_admin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-red-800">
              Alasan Ditolak
            </div>
            <div className="text-sm text-red-700 mt-1">
              {order.catatan_admin}
            </div>
          </div>
        )}
      </div>

      {/* Info Penerima */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-2">
          🚚 Alamat Pengiriman
        </h2>
        <div className="text-sm space-y-1">
          <div className="font-bold text-gray-900">
            {order.nama_penerima}
          </div>
          <div className="text-gray-700">{order.no_hp}</div>
          <div className="text-gray-700">{order.alamat}</div>
          <div className="text-gray-700">
            {order.kota}, {order.provinsi} {order.kode_pos}
          </div>
        </div>
        {order.catatan && (
          <div className="text-xs text-gray-500 mt-2 italic">
            📝 {order.catatan}
          </div>
        )}
      </div>

      {/* Produk */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          📦 Produk
        </h2>
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div
              key={i}
              className="flex gap-3 border-b border-gray-100 pb-2 last:border-b-0"
            >
              {item.foto_url && (
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.foto_url}
                    alt={item.nama_produk}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-900">
                  {item.nama_produk}
                </div>
                <div className="text-xs text-gray-500">
                  {formatRp(item.harga)} × {item.qty} {item.satuan || ""}
                </div>
              </div>
              <div className="font-bold text-gray-900 text-sm">
                {formatRp(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pembayaran */}
      {isPending && (
        <div className="bg-white border-2 border-orange-400 rounded-2xl p-4 mb-4 shadow-lg">
          <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
            💳 Cara Bayar
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bank</span>
                <span className="font-bold">{PAYMENT_INFO.bank}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">
                    {PAYMENT_INFO.nomor_rekening}
                  </span>
                  <button
                    onClick={handleCopyRekening}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atas Nama</span>
                <span className="font-bold">{PAYMENT_INFO.nama_pemilik}</span>
              </div>
              <div className="flex justify-between items-center border-t border-orange-200 pt-2 mt-2">
                <span className="font-bold text-gray-700">
                  Nominal Transfer
                </span>
                <span className="font-bold text-orange-700 text-xl">
                  {formatRp(order.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800 leading-relaxed">
            <strong>📌 Langkah:</strong>
            <br />
            1. Transfer tepat {formatRp(order.total)} ke rekening di atas
            <br />
            2. Screenshot bukti transfer
            <br />
            3. Klik tombol WhatsApp di bawah
            <br />
            4. Kirim bukti transfer
            <br />
            5. Tunggu approve admin (1×24 jam)
          </div>

          <button
            onClick={handleKirimWA}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-base"
          >
            📱 Kirim Bukti Transfer via WhatsApp
          </button>

          <div className="text-center text-[10px] text-gray-400 mt-2">
            Admin: {PAYMENT_INFO.whatsapp_display}
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          💰 Ringkasan
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatRp(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ongkir</span>
            <span>{formatRp(order.ongkir)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-baseline">
            <span className="font-bold">Total</span>
            <span className="text-xl font-bold text-orange-600">
              {formatRp(order.total)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
