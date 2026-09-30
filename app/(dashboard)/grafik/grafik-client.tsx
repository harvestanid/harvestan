"use client";

import { useState } from "react";
import { GrafikPanen } from "./grafik-panen";
import { GrafikHarga } from "./grafik-harga";
import type {
  HarvestRaw,
  LandRaw,
  PenggarapRaw,
} from "@/lib/utils/grafik-helpers";

type Tab = "panen" | "harga";

type Props = {
  penggaraps: PenggarapRaw[];
  lands: LandRaw[];
  harvests: HarvestRaw[];
};

const TABS: { id: Tab; icon: string; label: string; desc: string }[] = [
  {
    id: "panen",
    icon: "🌾",
    label: "Hasil Panen",
    desc: "Produksi, produktivitas & kinerja penggarap",
  },
  {
    id: "harga",
    icon: "💰",
    label: "Harga Komoditas",
    desc: "Tren harga jual per komoditas sepanjang waktu",
  },
];

export function GrafikClient({ penggaraps, lands, harvests }: Props) {
  const [tab, setTab] = useState<Tab>("panen");

  return (
    <div className="space-y-6">
      {/* TAB SWITCHER */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-2 shadow-lg shadow-[#2c5e2e]/5">
        <div className="grid grid-cols-2 gap-2">
          {TABS.map((t) => {
            const aktif = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`text-left p-3 md:p-4 rounded-2xl transition-all border-2 ${
                  aktif
                    ? "bg-gradient-to-br from-[#2c5e2e] to-[#1f4521] border-[#2c5e2e] shadow-md"
                    : "bg-white border-transparent hover:border-[#f0b429]/40 hover:bg-[#f0b429]/5"
                }`}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <span
                    className={`text-2xl md:text-3xl flex-shrink-0 transition-transform ${
                      aktif ? "scale-110" : ""
                    }`}
                  >
                    {t.icon}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={`text-sm md:text-base font-bold tracking-tight ${
                        aktif ? "text-white" : "text-[#2c5e2e]"
                      }`}
                    >
                      {t.label}
                    </div>
                    <div
                      className={`text-[10px] md:text-xs mt-0.5 leading-relaxed ${
                        aktif ? "text-[#f0b429]" : "text-[#2c5e2e]/60"
                      }`}
                    >
                      {t.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      {tab === "panen" && (
        <GrafikPanen
          penggaraps={penggaraps}
          lands={lands}
          harvests={harvests}
        />
      )}

      {tab === "harga" && (
        <GrafikHarga
          penggaraps={penggaraps}
          lands={lands}
          harvests={harvests}
        />
      )}
    </div>
  );
}
