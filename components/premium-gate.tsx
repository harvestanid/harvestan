"use client";

import { useState } from "react";
import { UpgradeModal } from "./upgrade-modal";

type Props = {
  isPremium: boolean;
  feature: string; // Nama fitur (untuk ditampilkan di modal)
  children: React.ReactNode;
  onLockedClick?: () => void;
  lockedView?: React.ReactNode; // Custom view kalau locked (opsional)
};

export function PremiumGate({
  isPremium,
  feature,
  children,
  onLockedClick,
  lockedView,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  // Kalau premium, tampilkan children langsung
  if (isPremium) {
    return <>{children}</>;
  }

  // Kalau locked, bungkus dengan tombol yang memicu modal
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onLockedClick) {
      onLockedClick();
    }
    setShowModal(true);
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="relative cursor-pointer group"
        title={`🔒 ${feature} (Premium)`}
      >
        {/* Render preview (children) tapi opacity dikurangi */}
        <div className="opacity-60 group-hover:opacity-70 transition pointer-events-none">
          {lockedView || children}
        </div>

        {/* Overlay lock icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition rounded-lg">
          <div className="bg-white border-2 border-orange-400 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs font-bold text-orange-700">
            <span className="text-base">🔒</span>
            <span className="hidden sm:inline">Premium</span>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
      />
    </>
  );
}

// ===================================================
// VARIAN: Locked Button (untuk tombol langsung)
// ===================================================
type LockedButtonProps = {
  isPremium: boolean;
  feature: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function PremiumButton({
  isPremium,
  feature,
  children,
  onClick,
  className = "",
}: LockedButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (isPremium) {
    return (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${className} relative`}
      >
        <span className="opacity-80">{children}</span>
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
          🔒
        </span>
      </button>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
      />
    </>
  );
}
