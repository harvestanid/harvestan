"use client";

import Link from "next/link";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  feature: string; // Nama fitur yang dicoba diakses
};

export function UpgradeModal({ isOpen, onClose, feature }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-orange-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-2xl font-bold mb-1">Fitur Premium</h2>
          <p className="text-sm text-white/90">
            <strong>{feature}</strong> hanya untuk pengguna Premium
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-xs font-bold text-green-800 mb-2">
              ✨ YANG ANDA DAPATKAN
            </div>
            <ul className="text-sm text-green-900 space-y-1.5">
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Semua fitur unlocked</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Unlimited penggarap & lahan</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Export PDF & Excel data sendiri</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>GPS walking & penimbangan gabah</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Backup & import unlimited</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span>
                <span>Update fitur baru selamanya</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-xl p-4 text-center">
            <div className="text-xs text-orange-800 font-medium mb-1">
              HARGA SEKALI BAYAR
            </div>
            <div className="text-4xl font-bold text-orange-700 mb-1">
              Rp 59.000
            </div>
            <div className="text-xs text-orange-600">
              Akses selamanya · Tanpa langganan bulanan
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Link
              href="/premium"
              className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-center py-3 rounded-xl transition shadow-lg hover:shadow-xl"
              onClick={onClose}
            >
              💎 Upgrade Sekarang
            </Link>

            <Link
              href="/demo"
              className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium text-center py-2.5 rounded-xl transition border border-blue-200"
              onClick={onClose}
            >
              🎬 Lihat Demo Dulu
            </Link>

            <button
              onClick={onClose}
              className="block w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition"
            >
              Nanti saja
            </button>
          </div>

          {/* Info tambahan */}
          <p className="text-[10px] text-center text-gray-500 italic">
            💡 Tips: Coba lihat demo 10 tahun dulu untuk merasakan manfaat
            lengkap
          </p>
        </div>
      </div>
    </div>
  );
}
