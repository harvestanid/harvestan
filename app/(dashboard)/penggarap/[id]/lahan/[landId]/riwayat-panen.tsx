"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Harvest = {
  id: string;
  tanggal: string;
  komoditas: string;
  musim: string | null;
  hasil_kg: number;
  profit_bersih: number;
  profit_owner: number;
  profit_penggarap: number;
  potongan_hutang: number;
};

type Props = {
  penggarapId: string;
  landId: string;
  luas: number;
  harvests: Harvest[];
  isMandiri: boolean;
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function RiwayatPanen({
  penggarapId,
  landId,
  luas,
  harvests,
  isMandiri,
}: Props) {
  const router = useRouter();
  const [modeSelect, setModeSelect] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  function togglePilih(id: string) {
    setDipilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pilihSemua() {
    if (dipilih.size === harvests.length) {
      setDipilih(new Set());
    } else {
      setDipilih(new Set(harvests.map((h) => h.id)));
    }
  }

  function batalSelect() {
    setModeSelect(false);
    setDipilih(new Set());
  }

  async function handleHapus() {
    if (dipilih.size === 0) return;

    const adaPotongan = harvests.some(
      (h) => dipilih.has(h.id) && Number(h.potongan_hutang || 0) > 0
    );

    const pesan =
      `⚠️ Hapus ${dipilih.size} panen yang dipilih?\n\n` +
      (adaPotongan
        ? `Ada panen yang memotong hutang. Hutang akan otomatis dikembalikan.\n\n`
        : "") +
      `Aksi ini tidak bisa dibatalkan.\n\n` +
      `Ketik "HAPUS" untuk konfirmasi:`;

    const konfirmasi = prompt(pesan);
    if (konfirmasi === null) return;
    if (konfirmasi.trim().toUpperCase() !== "HAPUS") {
      alert("❌ Konfirmasi tidak cocok. Batal.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/panen/delete-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ harvest_ids: Array.from(dipilih) }),
      });
      const json = await res.json();

      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus"));
        return;
      }

      alert(`✅ ${json.message}`);
      setDipilih(new Set());
      setModeSelect(false);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-gray-900">
          📜 Riwayat Panen ({harvests.length})
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          {!modeSelect && (
            <>
              {harvests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModeSelect(true)}
                  className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  ☑️ Pilih
                </button>
              )}
              <Link
                href={`/penggarap/${penggarapId}/lahan/${landId}/panen/baru`}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                + Input Panen
              </Link>
            </>
          )}

          {modeSelect && (
            <>
              <button
                type="button"
                onClick={pilihSemua}
                className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-800 text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                {dipilih.size === harvests.length
                  ? "✓ Batal Semua"
                  : "✓ Pilih Semua"}
              </button>
              <button
                type="button"
                onClick={handleHapus}
                disabled={dipilih.size === 0 || loading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading
                  ? "⏳ Menghapus..."
                  : `🗑️ Hapus (${dipilih.size})`}
              </button>
              <button
                type="button"
                onClick={batalSelect}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
              >
                ✕ Batal
              </button>
            </>
          )}
        </div>
      </div>

      {modeSelect && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
          💡 Centang panen yang mau dihapus, lalu klik <strong>Hapus</strong>.
          {dipilih.size > 0 && (
            <span className="ml-1 font-bold">
              ({dipilih.size} dipilih)
            </span>
          )}
        </div>
      )}

      {harvests.length === 0 ? (
        <div className="text-center py-8 text-gray-400 italic text-sm">
          Belum ada riwayat panen di lahan ini
        </div>
      ) : (
        <div className="space-y-2">
          {harvests.map((h) => {
            const prod = Number(h.hasil_kg) / luas;
            const adaPotongan = Number(h.potongan_hutang || 0) > 0;
            const isDipilih = dipilih.has(h.id);

            const kartuContent = (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {modeSelect && (
                      <input
                        type="checkbox"
                        checked={isDipilih}
                        onChange={() => togglePilih(h.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 accent-red-600 flex-shrink-0"
                      />
                    )}
                    <span className="text-xs font-bold text-gray-800">
                      {KOMODITAS_LABEL[h.komoditas] || h.komoditas}
                    </span>
                    {h.musim && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                        🗓️ {h.musim}
                      </span>
                    )}
                    {adaPotongan && (
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                        💸 Potong Hutang
                      </span>
                    )}
                    {isMandiri && (
                      <span className="text-[10px] bg-[#2c5e2e]/10 text-[#2c5e2e] px-2 py-0.5 rounded-full font-bold">
                        🌱 Full Penggarap
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {new Date(h.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div
                  className={`grid ${
                    isMandiri ? "grid-cols-3" : "grid-cols-4"
                  } gap-2 text-xs`}
                >
                  <div>
                    <div className="text-gray-500 text-[10px]">Hasil</div>
                    <div className="font-bold text-gray-800">
                      {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">
                      Produktivitas
                    </div>
                    <div className="font-bold text-green-700">
                      {prod.toFixed(0)} Kg/Ha
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">
                      Profit Bersih
                    </div>
                    <div className="font-bold text-blue-700 break-words">
                      {formatRp(Number(h.profit_bersih || 0))}
                    </div>
                  </div>
                  {!isMandiri && (
                    <div>
                      <div className="text-gray-500 text-[10px]">
                        Bagi Hasil
                      </div>
                      <div className="text-[10px] font-bold">
                        <span className="text-green-700">
                          👤 {formatRp(Number(h.profit_owner || 0))}
                        </span>
                        {" · "}
                        <span className="text-orange-700">
                          👨‍🌾 {formatRp(Number(h.profit_penggarap || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );

            if (modeSelect) {
              return (
                <label
                  key={h.id}
                  className={`block rounded-lg p-3 border-2 cursor-pointer transition ${
                    isDipilih
                      ? "bg-red-50 border-red-400"
                      : "bg-gray-50 hover:bg-red-50 border-gray-200 hover:border-red-300"
                  }`}
                >
                  {kartuContent}
                </label>
              );
            }

            return (
              <Link
                key={h.id}
                href={`/penggarap/${penggarapId}/lahan/${landId}/panen/${h.id}`}
                className="block bg-gray-50 hover:bg-green-50 rounded-lg p-3 border border-gray-200 transition"
              >
                {kartuContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
