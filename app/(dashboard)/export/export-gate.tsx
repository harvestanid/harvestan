"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/upgrade-modal";

type Props = {
  isPremium: boolean;
  isDemo?: boolean;
  feature: string;
  children: React.ReactNode;
  inline?: boolean;
};

export function ExportPremiumGate({
  isPremium,
  isDemo = false,
  feature,
  children,
  inline = false,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  // ✅ Akses kalau premium ATAU mode demo
  const isUnlocked = isPremium || isDemo;

  if (isUnlocked) {
    return <>{children}</>;
  }

  // Inline mode (tombol kecil)
  if (inline) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="relative bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-medium px-3 py-2 rounded-lg transition border border-orange-300 flex items-center gap-1"
          title={`🔒 ${feature} (Premium)`}
        >
          <span>🔒</span>
          <span>PDF</span>
        </button>
        <UpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
        />
      </>
    );
  }

  // Block mode (tombol besar)
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative block w-full"
      >
        <div className="opacity-60 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition rounded-xl">
          <div className="bg-white border-2 border-orange-400 rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-bold text-orange-700">
            <span className="text-lg">🔒</span>
            <span>Premium</span>
          </div>
        </div>
      </button>
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
      />
    </>
  );
}
