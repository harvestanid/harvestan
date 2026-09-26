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
  defaultPersen: number;
};

export function FormPanenFields({
  musimList: initialMusimList,
  defaultPersen,
}: Props) {
  const [komoditas, setKomoditas] = useState("padi");
  const [musimList, setMusimList] = useState<Musim[]>(initialMusimList);
  const [selectedMusim, setSelectedMusim] = useState("");
  const [showModalMusim, setShowModalMusim] = useState(false);
  const [persenOwner, setPersenOwner] = useState(defaultPersen);
  const [inputKey, setInputKey] = useState(0);
  const [skema, setSkema] = useState(String(defaultPersen));

  const persenPenggarap = 100 - persenOwner;

  function handleSkemaChange(value: string) {
    setSkema(value);
    if (value !== "custom") {
      const num = parseInt(value, 10);
      setPersenOwner(num);
    } else {
      setPersenOwner(0);
      setInputKey((prev) => prev + 1);
    }
  }

  async function handleSimpanMusimClick() {
    const form = document.getElementById(
      "form-musim-baru"
    ) as HTMLFormElement | null;
    if (!form) return;

    const formData = new FormData(form);
    const nama = (formData.get("nama") as string) || "";
    const tanggalMulai = (formData.get("tanggal_mulai") as string) || "";
    const catatan = (formData.get("catatan") as string) || "";

    if (!nama.trim()) {
      alert("❌ Isi nama musim dulu");
      return;
    }

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
        alert("❌ " + (json.error || "Gagal simpan musim"));
        return;
      }

      setMusimList([json.data, ...musimList]);
      setSelectedMusim(json.data.nama);
      setShowModalMusim(false);
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    }
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Komoditas <span className="text-red-500">*</span>
        </label>
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
      </div>

      {komoditas === "cabai_rawit" && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
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
            💡 Cabai dipanen berkali-kali dalam 1 musim.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 Skema Bagi Hasil
        </label>
        <select
          value={skema}
          onChange={(e) => handleSkemaChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="50">50 : 50 (Owner : Penggarap)</option>
          <option value="60">60 : 40 (Owner : Penggarap)</option>
          <option value="70">70 : 30 (Owner : Penggarap)</option>
          <option value="100">100 : 0 (Owner garap sendiri)</option>
          <option value="custom">⚙️ Custom (input manual)</option>
        </select>

        {skema === "custom" && (
          <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-800 mb-2">
              ⚙️ Atur Persentase Custom:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Owner (%)
                </label>
                <input
                  key={inputKey}
                  type="number"
                  inputMode="numeric"
                  defaultValue={persenOwner === 0 ? "" : persenOwner}
                  onChange={(e) => {
                    const v = e.target.value;
                    let num = v === "" ? 0 : parseInt(v, 10);
                    if (isNaN(num)) num = 0;
                    if (num > 100) num = 100;
                    if (num < 0) num = 0;
                    setPersenOwner(num);
                  }}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Penggarap (%)
                </label>
                <input
                  type="number"
                  value={persenPenggarap}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-bold text-center cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {skema !== "custom" && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
            Owner: <strong>{persenOwner}%</strong> &middot; Penggarap:{" "}
            <strong>{persenPenggarap}%</strong>
          </div>
        )}

        <input type="hidden" name="persen_owner" value={persenOwner} />
      </div>

      {showModalMusim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">
                🗓️ Bikin Musim Cabai Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowModalMusim(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div id="form-musim-baru" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Musim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  placeholder="Contoh: Cabai 2026-1"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  name="catatan"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimpanMusimClick}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg"
                >
                  💾 Simpan Musim
                </button>
                <button
                  type="button"
                  onClick={() => setShowModalMusim(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
