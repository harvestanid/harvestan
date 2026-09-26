"use client";

import { useState } from "react";

type Musim = {
  id: string;
  nama: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

type Props = {
  musimList: Musim[];
};

export function MusimSelectorKomoditas({ musimList: initialMusimList }: Props) {
  const [komoditas, setKomoditas] = useState("padi");
  const [musimList, setMusimList] = useState<Musim[]>(initialMusimList);
  const [selectedMusim, setSelectedMusim] = useState("");
  const [showModalMusim, setShowModalMusim] = useState(false);

  return (
    <>
      <select
        name="komoditas"
        value={komoditas}
        onChange={(e) => setKomoditas(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="padi">🌾 Padi</option>
        <option value="jagung">🌽 Jagung</option>
        <option value="kacang_tanah">🥜 Kacang Tanah</option>
        <option value="bawang_merah">🧅 Bawang Merah</option>
        <option value="cabai_rawit">🌶️ Cabai Rawit</option>
      </select>

      {/* Kalau cabai rawit: field musim */}
      {komoditas === "cabai_rawit" && (
        <div className="col-span-2 mt-3 bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
          <label className="block text-sm font-medium text-orange-900 mb-2">
            🗓️ Musim Tanam Cabai <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2">
            <select
              name="musim"
              value={selectedMusim}
              onChange={(e) => setSelectedMusim(e.target.value)}
              required
              className="flex-1 border border-orange-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">-- Pilih Musim --</option>
              {musimList.map((m) => (
                <option key={m.id} value={m.nama}>
                  {m.nama}
                  {m.tanggal_mulai
                    ? ` (mulai ${new Date(m.tanggal_mulai).toLocaleDateString(
                        "id-ID",
                        { month: "short", year: "numeric" }
                      )})`
                    : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowModalMusim(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-lg text-sm whitespace-nowrap transition"
            >
              + Baru
            </button>
          </div>

          <p className="text-xs text-orange-700 mt-2">
            💡 Cabai dipanen berkali-kali dalam 1 musim. Pilih musim yang sama
            untuk panen lanjutan, atau bikin musim baru kalau tanam ulang.
          </p>
        </div>
      )}

      {showModalMusim && (
        <ModalMusimBaru
          onClose={() => setShowModalMusim(false)}
          onSuccess={(musimBaru) => {
            setMusimList([musimBaru, ...musimList]);
            setSelectedMusim(musimBaru.nama);
            setShowModalMusim(false);
          }}
        />
      )}
    </>
  );
}

// ===== MODAL BIKIN MUSIM BARU =====
function ModalMusimBaru({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (musim: Musim) => void;
}) {
  const [nama, setNama] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/musim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          tanggal_mulai: tanggalMulai || null,
          catatan: catatan || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal simpan musim");
        setLoading(false);
        return;
      }

      onSuccess(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">
            🗓️ Bikin Musim Cabai Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSimpan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Musim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Cabai 2026-1"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pakai nama yang mudah diingat
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai Tanam (opsional)
            </label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Contoh: Bibit dari toko X, luas 0.3 Ha"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !nama.trim()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "⏳ Menyimpan..." : "💾 Simpan Musim"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
