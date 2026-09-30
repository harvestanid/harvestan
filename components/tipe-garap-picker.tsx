"use client";

export type TipeGarap =
  | "mandiri"
  | "bagi_hasil_owner"
  | "bagi_hasil_penggarap";

type Props = {
  value: TipeGarap;
  onChange: (value: TipeGarap) => void;
  konteks?: "self" | "lain" | "semua";
  namaOwnerExternal?: string;
  onNamaOwnerExternalChange?: (value: string) => void;
  persenOwner?: number;
  persenPenggarap?: number;
  onPersenChange?: (owner: number, penggarap: number) => void;
  compact?: boolean;
};

const OPSI_SEMUA: {
  id: TipeGarap;
  icon: string;
  judul: string;
  desc: string;
  warna: string;
}[] = [
  {
    id: "mandiri",
    icon: "🌱",
    judul: "Lahan Saya, Saya Garap",
    desc: "Semua profit untuk saya (100%)",
    warna: "green",
  },
  {
    id: "bagi_hasil_owner",
    icon: "👤",
    judul: "Lahan Saya, Digarap Orang",
    desc: "Saya owner, bagi hasil dengan penggarap",
    warna: "blue",
  },
  {
    id: "bagi_hasil_penggarap",
    icon: "👨‍🌾",
    judul: "Lahan Orang, Saya yang Garap",
    desc: "Saya penggarap, bagi hasil dengan owner",
    warna: "orange",
  },
];

const SKEMA_PRESET: { owner: number; penggarap: number }[] = [
  { owner: 50, penggarap: 50 },
  { owner: 40, penggarap: 60 },
  { owner: 30, penggarap: 70 },
];

function warnaBorder(warna: string, aktif: boolean): string {
  if (!aktif) return "border-[#2c5e2e]/10 bg-white hover:border-[#2c5e2e]/30";
  if (warna === "green") return "border-[#2c5e2e] bg-[#2c5e2e]/5";
  if (warna === "blue") return "border-blue-500 bg-blue-50";
  if (warna === "orange") return "border-orange-500 bg-orange-50";
  return "border-[#2c5e2e] bg-[#2c5e2e]/5";
}

export function TipeGarapPicker({
  value,
  onChange,
  konteks = "semua",
  namaOwnerExternal = "",
  onNamaOwnerExternalChange,
  persenOwner = 50,
  persenPenggarap = 50,
  onPersenChange,
  compact = false,
}: Props) {
  // Filter opsi sesuai konteks
  const opsi =
    konteks === "self"
      ? OPSI_SEMUA.filter(
          (o) =>
            o.id === "mandiri" || o.id === "bagi_hasil_penggarap"
        )
      : konteks === "lain"
      ? OPSI_SEMUA.filter((o) => o.id === "bagi_hasil_owner")
      : OPSI_SEMUA;

  const tampilkanBagiHasil =
    value === "bagi_hasil_owner" || value === "bagi_hasil_penggarap";

  function handlePreset(owner: number, penggarap: number) {
    if (onPersenChange) onPersenChange(owner, penggarap);
  }

  // Kalau konteks "lain", tandai jelas
  const infoKonteks =
    konteks === "lain"
      ? "Penggarap ini akan digarapkan ke lahan Anda (Anda owner)"
      : konteks === "self"
      ? "Pilih sesuai kondisi: lahan sendiri atau lahan orang"
      : null;

  return (
    <div className="space-y-4">
      {/* Pilih Tipe Garap */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          🌾 Tipe Garap Lahan <span className="text-red-500">*</span>
        </label>

        {infoKonteks && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-3">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              ℹ️ {infoKonteks}
            </p>
          </div>
        )}

        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1"}`}>
          {opsi.map((op) => {
            const aktif = value === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => onChange(op.id)}
                className={`text-left p-3 md:p-4 rounded-2xl border-2 transition-all ${warnaBorder(
                  op.warna,
                  aktif
                )}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl md:text-3xl flex-shrink-0">
                    {op.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm md:text-base font-bold text-[#2c5e2e]">
                        {op.judul}
                      </span>
                      {aktif && (
                        <span className="text-[10px] bg-[#2c5e2e] text-white font-bold px-2 py-0.5 rounded-full">
                          ✓ DIPILIH
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] md:text-xs text-[#2c5e2e]/60 mt-1 leading-relaxed">
                      {op.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagi Hasil — hanya muncul kalau pilih #2 atau #3 */}
      {tampilkanBagiHasil && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-4 space-y-3">
          {/* Nama Owner External — hanya untuk penggarap */}
          {value === "bagi_hasil_penggarap" && (
            <div>
              <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1.5">
                👤 Nama Pemilik Lahan (Owner)
              </label>
              <input
                type="text"
                value={namaOwnerExternal}
                onChange={(e) =>
                  onNamaOwnerExternalChange &&
                  onNamaOwnerExternalChange(e.target.value)
                }
                placeholder="Contoh: Pak Haji"
                maxLength={80}
                className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
              />
              <p className="text-[10px] text-[#2c5e2e]/60 mt-1 italic">
                Opsional. Buat catatan di laporan aja.
              </p>
            </div>
          )}

          {/* Skema Bagi Hasil */}
          <div>
            <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              📊 Skema Bagi Hasil
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {SKEMA_PRESET.map((s) => {
                const aktif =
                  persenOwner === s.owner && persenPenggarap === s.penggarap;
                return (
                  <button
                    key={`${s.owner}-${s.penggarap}`}
                    type="button"
                    onClick={() => handlePreset(s.owner, s.penggarap)}
                    className={`py-2.5 px-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                      aktif
                        ? "border-[#f0b429] bg-[#f0b429] text-[#2c5e2e]"
                        : "border-[#2c5e2e]/20 bg-white text-[#2c5e2e] hover:border-[#f0b429]/60"
                    }`}
                  >
                    {s.owner}:{s.penggarap}
                  </button>
                );
              })}
            </div>

            {/* Custom slider */}
            <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-3 space-y-2">
              <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
                ⚙️ Custom (opsional)
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-[#2c5e2e]/60 mb-1">
                    Owner ({persenOwner}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={persenOwner}
                    onChange={(e) => {
                      const owner = parseInt(e.target.value) || 0;
                      if (onPersenChange) onPersenChange(owner, 100 - owner);
                    }}
                    className="w-full accent-[#2c5e2e]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-[#2c5e2e]/60 mb-1">
                    Penggarap ({persenPenggarap}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={persenPenggarap}
                    onChange={(e) => {
                      const penggarap = parseInt(e.target.value) || 0;
                      if (onPersenChange) onPersenChange(100 - penggarap, penggarap);
                    }}
                    className="w-full accent-[#f0b429]"
                  />
                </div>
              </div>
              <div className="text-[10px] text-[#2c5e2e]/60 text-center italic">
                Owner {persenOwner}% · Penggarap {persenPenggarap}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info bantuan untuk mandiri */}
      {value === "mandiri" && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3">
          <div className="text-[11px] text-green-800 leading-relaxed">
            ✅ <strong>Semua profit 100% untuk penggarap</strong> (diri sendiri).
            Field bagi hasil akan disembunyikan di form input panen.
          </div>
        </div>
      )}
    </div>
  );
}
