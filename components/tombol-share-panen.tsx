"use client";

import { useState } from "react";
import { SharePanenModal } from "./share-panen-modal";

type Props = {
  komoditas: string;
  komoditasLabel: string;
  hasilKg: number;
  luasHa: number;
  produktivitas: number;
  hargaJual: number;
  tanggal: string;
  namaPenggarap?: string | null;
  namaLahan?: string | null;
  profitOwner?: number | null;
  profitPenggarap?: number | null;
  polygon?: { type: "Polygon"; coordinates: number[][][] } | null;
  koordinat?: string | null;
  variant?: "button" | "icon";
  label?: string;
};

export function TombolSharePanen({
  variant = "button",
  label = "📸 Share ke IG Story",
  ...data
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-[#f0b429]/15 hover:bg-[#f0b429]/30 flex items-center justify-center text-lg transition"
          aria-label="Share postcard"
        >
          📸
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f0b429] to-orange-400 hover:from-orange-400 hover:to-[#f0b429] text-[#2c5e2e] font-bold text-sm px-5 py-3 rounded-full transition-all hover:scale-[1.02] shadow-md"
        >
          {label}
        </button>
      )}

      <SharePanenModal open={open} onClose={() => setOpen(false)} data={data} />
    </>
  );
}
