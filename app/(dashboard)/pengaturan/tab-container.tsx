"use client";

import { useState } from "react";
import { AkunTab } from "./akun-tab";
import { KategoriTab } from "./kategori-tab";

type Props = {
  user: {
    email: string;
    nama: string;
    username: string;
  };
};

type TabId = "akun" | "kategori";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "akun", label: "Akun", icon: "👤" },
  { id: "kategori", label: "Kategori", icon: "🏷️" },
];

export function PengaturanTab({ user }: Props) {
  const [tab, setTab] = useState<TabId>("akun");

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-[#2c5e2e]/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-block bg-[#f0b429]/20 border border-[#f0b429]/40 rounded-full px-3 py-1.5 text-[10px] font-bold mb-3 uppercase tracking-[0.25em] text-[#f0b429]">
            ⚙️ Pengaturan
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-2">
            Pengaturan Akun
          </h1>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
            Kelola profil, password, dan standar KPI produktivitas Anda.
          </p>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 md:flex-none px-5 py-3 rounded-full text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-[#2c5e2e] text-white shadow-lg shadow-[#2c5e2e]/30 scale-105"
                : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== KONTEN ===== */}
      {tab === "akun" && <AkunTab user={user} />}
      {tab === "kategori" && <KategoriTab />}
    </div>
  );
}
