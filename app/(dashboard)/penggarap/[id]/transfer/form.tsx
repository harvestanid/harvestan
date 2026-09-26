"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Land = {
  id: string;
  nama: string;
  luas: number;
  lokasi_koordinat: string | null;
};

type Penggarap = {
  id: string;
  nama: string;
};

type Props = {
  fromPenggarap: Penggarap;
  lands: Land[];
  otherPenggaraps: Penggarap[];
  totalHutangAktif: number;
  jumlahHutangAktif: number;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function TransferForm({
  fromPenggarap,
  lands,
  otherPenggaraps,
  totalHutangAktif,
  jumlahHutangAktif,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toPenggarapId, setToPenggarapId] = useState(
    otherPenggaraps[0]?.id || ""
  );
  const [selectedLands, setSelectedLands] = useState<string[]>(
    lands.map((l) => l.id)
  );
  const [transferHutang, setTransferHutang] = useState(false);

  const toPenggarap = otherPenggaraps.find((p) => p.id === toPenggarapId);
  const totalLuasTerpilih = lands
    .filter((l) => selectedLands.includes(l.id))
    .reduce((s, l) => s + Number(l.luas), 0);

  function toggleLand(landId: string) {
    setSelectedLands((prev) =>
      prev.includes(landId)
        ? prev.filter((id) => id !== landId)
        : [...prev, landId]
    );
  }

  function toggleAll() {
    if (selectedLands.length === lands.length) {
      setSelectedLands([]);
    } else {
      setSelectedLands(lands.map((l) => l.id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!toPenggarapId) {
      alert("❌ Pilih penggarap tujuan");
      return;
    }

    if (selectedLands.length === 0) {
      alert("❌ Pilih minimal 1 lahan");
      return;
    }

    const pesan =
      `Transfer ${selectedLands.length} lahan (${totalLuasTerpilih.toFixed(2)} Ha)\n` +
      `Dari: ${fromPenggarap.nama}\n` +
      `Ke: ${toPenggarap?.nama}\n` +
      (transferHutang && jumlahHutangAktif > 0
        ? `\n⚠️ Hutang aktif (${jumlahHutangAktif} hutang, ${formatRp(totalHutangAktif)}) akan IKUT DIPINDAH.\n`
        : "\n") +
      `\nRiwayat panen TETAP di lahan (tidak hilang).\n\n` +
      `Lanjutkan?`;

    if (!confirm(pesan)) return;

    setLoading(true);
    const res = await fetch("/api/transfer-lahan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_penggarap_id: fromPenggarap.id,
        to_penggarap_id: toPenggarapId,
        land_ids: selectedLands,
        transfer_hutang: transferHutang && jumlahHutangAktif > 0,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal transfer: " + (json.error || "Unknown error"));
      return;
    }

    alert(
      `✅ Transfer berhasil!\n\n` +
        `📦 ${json.transferred_lands} lahan dipindah dari ${json.from} ke ${json.to}\n` +
        (json.transferred_hutang > 0
          ? `💰 ${json.transferred_hutang} hutang aktif ikut dipindah`
          : "")
    );

    router.push(`/penggarap/${toPenggarapId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
    >
      {/* Penggarap Asal (info) */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
          Dari Penggarap
        </label>
        <div className="bg-gray-100 rounded-lg px-4 py-3 font-medium text-gray-900">
          👨‍🌾 {fromPenggarap.nama}
        </div>
      </div>

      {/* Penggarap Tujuan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ke Penggarap <span className="text-red-500">*</span>
        </label>
        <select
          value={toPenggarapId}
          onChange={(e) => setToPenggarapId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {otherPenggaraps.map((p) => (
            <option key={p.id} value={p.id}>
              👨‍🌾 {p.nama}
            </option>
          ))}
        </select>
      </div>

      {/* Pilih Lahan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Pilih Lahan <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-green-700 hover:text-green-800 font-medium"
          >
            {selectedLands.length === lands.length
              ? "⬜ Uncheck Semua"
              : "✅ Pilih Semua"}
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {lands.map((l) => (
            <label
              key={l.id}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                selectedLands.includes(l.id)
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLands.includes(l.id)}
                onChange={() => toggleLand(l.id)}
                className="mt-1 w-5 h-5 accent-green-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">🗺️ {l.nama}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {Number(l.luas).toFixed(2)} Ha
                  {l.lokasi_koordinat && (
                    <span className="ml-2 text-blue-600 font-mono">
                      📍 {l.lokasi_koordinat}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-2 text-xs text-gray-600 bg-blue-50 rounded-lg p-2 border border-blue-200">
          ✅ Terpilih: <strong>{selectedLands.length}</strong> lahan (
          {totalLuasTerpilih.toFixed(2)} Ha)
        </div>
      </div>

      {/* Transfer Hutang (opsional) */}
      {jumlahHutangAktif > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={transferHutang}
              onChange={(e) => setTransferHutang(e.target.checked)}
              className="mt-1 w-5 h-5 accent-red-600"
            />
            <div className="flex-1">
              <div className="font-bold text-yellow-900 text-sm">
                💸 Transfer Hutang Aktif
              </div>
              <div className="text-xs text-yellow-800 mt-1">
                Pindahkan <strong>{jumlahHutangAktif} hutang aktif</strong> (
                {formatRp(totalHutangAktif)}) dari {fromPenggarap.nama} ke{" "}
                {toPenggarap?.nama || "penggarap baru"}.
              </div>
              <div className="text-[11px] text-yellow-700 mt-1 italic">
                Kalau tidak dicentang, hutang tetap di {fromPenggarap.nama}.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>ℹ️ Info:</strong> Riwayat panen & data lain yang terkait dengan
        lahan <strong>tetap menempel</strong> di lahan tersebut (tidak hilang
        saat transfer).
      </div>

      {/* Tombol */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || selectedLands.length === 0}
          className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "🔄 Mentransfer..."
            : `🔄 Transfer ${selectedLands.length} Lahan`}
        </button>
        <Link
          href={`/penggarap/${fromPenggarap.id}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg transition"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
