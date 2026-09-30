"use client";

import Link from "next/link";
import { useState, useEffect, ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  feature?: string;
  children?: ReactNode;
};

const BENEFITS = [
  { icon: "📊", text: "Export Excel & PDF tanpa batas" },
  { icon: "🌾", text: "Multi-komoditas (padi, cabai, jagung, dll)" },
  { icon: "📈", text: "Grafik & laporan lengkap" },
  { icon: "💾", text: "Backup data otomatis" },
  { icon: "🎯", text: "Standar KPI kustom per komoditas" },
  { icon: "🚀", text: "Akses fitur baru lebih dulu" },
];

export function UpgradeModal({ open, onClose, feature, children }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 200);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 transition-opacity duration-200 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full md:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl transition-transform duration-300 ${
          closing ? "translate-y-4" : "translate-y-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] px-6 pt-6 pb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#f0b429]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Tutup"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-colors"
          >
            ✕
          </button>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f0b429] mb-3 shadow-lg">
              <span className="text-3xl">💎</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              Upgrade ke Premium
            </h2>
            <p className="text-xs text-white/80 leading-relaxed">
              {feature
                ? `${feature} tersedia untuk pengguna Premium`
                : "Buka semua fitur tanpa batas"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {children ? (
            children
          ) : (
            <>
              {/* Price card */}
              <div className="bg-gradient-to-br from-[#f0b429]/10 to-orange-50 border-2 border-[#f0b429]/40 rounded-2xl p-4 mb-5 text-center">
                <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">
                  Harga Spesial
                </div>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl font-bold text-[#2c5e2e] tracking-tight">
                    Rp 59.000
                  </span>
                  <span className="text-xs text-[#2c5e2e]/60 font-semibold">
                    / bulan
                  </span>
                </div>
                <div className="text-[10px] text-[#2c5e2e]/60 mt-1">
                  Bayar via transfer bank · Aktivasi manual maks. 1×24 jam
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2.5 mb-5">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#2c5e2e]/10 flex items-center justify-center text-sm flex-shrink-0">
                      {b.icon}
                    </div>
                    <div className="text-xs text-[#2c5e2e] font-medium leading-relaxed pt-1">
                      {b.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link
                  href="/premium"
                  onClick={handleClose}
                  className="block w-full text-center bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold text-sm px-4 py-3 rounded-full transition-all hover:scale-[1.02] shadow-md"
                >
                  💎 Lihat Paket & Bayar
                </Link>
                <Link
                  href="/demo"
                  onClick={handleClose}
                  className="block w-full text-center bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm px-4 py-3 rounded-full border-2 border-[#f0b429]/40 transition-all hover:scale-[1.02]"
                >
                  🎬 Coba Demo Dulu
                </Link>
                <button
                  onClick={handleClose}
                  className="block w-full text-center text-[11px] text-[#2c5e2e]/60 hover:text-[#2c5e2e] font-semibold px-4 py-2 transition-colors"
                >
                  Nanti saja
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
