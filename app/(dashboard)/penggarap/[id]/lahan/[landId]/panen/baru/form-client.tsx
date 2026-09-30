"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Musim = {
  id: string;
  nama: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

type Props = {
  hargaDefault: number;
  biayaDefault: number;
  totalHutang: number;
  musimList: Musim[];
  tipeGarap?: string;
  namaOwnerExternal?: string | null;
  persenOwnerDefault?: number;
  persenPenggarapDefault?: number;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function FormPanenFields({
  hargaDefault,
  biayaDefault,
  totalHutang,
  musimList: initialMusimList,
  tipeGarap = "bagi_hasil_owner",
  namaOwnerExternal = null,
  persenOwnerDefault = 50,
  persenPenggarapDefault = 50,
}: Props) {
  const router = useRouter();

  const isMandiri = tipeGarap === "mandiri";
  const isPenggarap = tipeGarap === "bagi_hasil_penggarap";

  const [komoditas, setKomoditas] = useState("padi");
  const [musimList, setMusimList] = useState<Musim[]>(initialMusimList);
  const [selectedMusim, setSelectedMusim] = useState("");
  const [showModalMusim, setShowModalMusim] = useState(false);
  const [persenOwner, setPersenOwner] = useState(
    isMandiri ? 0 : persenOwnerDefault
  );
  const [namaMusimBaru, setNamaMusimBaru] = useState("");
  const [tanggalMulaiBaru, setTanggalMulaiBaru] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [catatanMusimBaru, setCatatanMusimBaru] = useState("");
  const [loadingSimpanMusim, setLoadingSimpanMusim] = useState(false);
  const [errorMusim, setErrorMusim] = useState("");

  const persenPenggarap = 100 - persenOwner;

  async function handleSimpanMusimClick() {
    if (!namaMusimBaru.trim()) {
      setErrorMusim("Isi nama musim dulu");
      return;
    }

    setErrorMusim("");
    setLoadingSimpanMusim(true);

    try {
      const res = await fetch("/api/musim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaMusimBaru.trim(),
          tanggal_mulai: tanggalMulaiBaru || null,
          catatan: catatanMusimBaru || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMusim(json.error || "Gagal simpan musim");
        setLoadingSimpanMusim(false);
        return;
      }

      setMusimList([json.data, ...musimList]);
      setSelectedMusim(json.data.nama);
      setShowModalMusim(false);
      setNamaMusimBaru("");
      setTanggalMulaiBaru(new Date().toISOString().split("T")[0]);
      setCatatanMusimBaru("");
      router.refresh();
    } catch (err: any) {
      setErrorMusim(err.message || "Terjadi kesalahan");
    } finally {
      setLoadingSimpanMusim(false);
    }
  }

  function handleBukaModal() {
    setNamaMusimBaru("");
    setTanggalMulaiBaru(new Date().toISOString().split("T")[0]);
    setCatatanMusimBaru("");
    setErrorMusim("");
    setShowModalMusim(true);
  }

  return (
    <>
      {/* ===== TANGGAL ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tanggal Panen <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="tanggal"
          defaultValue={new Date().toISOString().split("T")[0]}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* ===== KOMODITAS ===== */}
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

      {/* ===== MUSIM (khusus cabai) ===== */}
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
              onClick={handleBukaModal}
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

      {/* ===== HASIL & HARGA ===== */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasil Panen (Kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="hasil_kg"
            step="any"
            min="0.01"
            required
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Harga per Kg (Rp) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="harga_gabah"
            step="any"
            min="0"
            required
            defaultValue={hargaDefault}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* ===== BIAYA ===== */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Biaya Panen per Kg (Rp)
          </label>
          <input
            type="number"
            name="biaya_panen_per_kg"
            step="any"
            min="0"
            defaultValue={biayaDefault}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Biaya Tambahan (Rp)
          </label>
          <input
            type="number"
            name="biaya_tambahan"
            step="any"
            min="0"
            defaultValue={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keterangan Biaya Tambahan
        </label>
        <input
          type="text"
          name="keterangan_biaya"
          placeholder="Contoh: Sewa mesin, transport"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* ===== SKEMA BAGI HASIL — KONDISIONAL ===== */}
      {isMandiri ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌱</span>
            <div className="text-xs text-green-900 leading-relaxed">
              <strong>Garap Sendiri</strong> — semua profit panen ini{" "}
              <strong>100% untuk penggarap</strong>. Field bagi hasil otomatis
              di-set 0:100.
            </div>
          </div>
          <input type="hidden" name="persen_owner" value="0" />
        </div>
      ) : (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-sm font-bold text-[#2c5e2e]">
              💰 Skema Bagi Hasil
            </label>
            {isPenggarap && namaOwnerExternal && (
              <span className="text-[10px] bg-orange-100 border border-orange-300 text-orange-800 rounded-full px-2.5 py-1 font-bold uppercase tracking-widest">
                👤 Owner: {namaOwnerExternal}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#2c5e2e] mb-1">
                {isPenggarap ? "Owner External (%)" : "Owner (%)"}
              </label>
              <input
                type="number"
                name="persen_owner"
                value={persenOwner}
                onChange={(e) => {
                  const v = e.target.value;
                  let num = v === "" ? 0 : parseInt(v, 10);
                  if (isNaN(num)) num = 0;
                  if (num > 100) num = 100;
                  if (num < 0) num = 0;
                  setPersenOwner(num);
                }}
                min="0"
                max="100"
                className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 focus:outline-none focus:border-[#f0b429] bg-white font-bold text-center text-[#2c5e2e]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2c5e2e] mb-1">
                Penggarap (%)
              </label>
              <input
                type="number"
                value={persenPenggarap}
                readOnly
                className="w-full bg-white/60 border-2 border-[#2c5e2e]/10 rounded-2xl px-3 py-2 text-[#2c5e2e] font-bold text-center cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { o: 50, p: 50 },
              { o: 40, p: 60 },
              { o: 30, p: 70 },
            ].map((s) => (
              <button
                key={`${s.o}-${s.p}`}
                type="button"
                onClick={() => setPersenOwner(s.o)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
                  persenOwner === s.o
                    ? "bg-[#f0b429] text-[#2c5e2e]"
                    : "bg-white border border-[#2c5e2e]/20 text-[#2c5e2e] hover:border-[#f0b429]"
                }`}
              >
                {s.o}:{s.p}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#f0b429]/40 rounded-xl px-3 py-2 text-xs text-[#2c5e2e] text-center">
            Owner: <strong>{persenOwner}%</strong> · Penggarap:{" "}
            <strong>{persenPenggarap}%</strong>
          </div>
        </div>
      )}

      {/* ===== BAWA PULANG ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🏠 Gabah Bawa Pulang (Kg)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              👨‍🌾 Penggarap
            </label>
            <input
              type="number"
              name="bawa_penggarap"
              step="any"
              min="0"
              defaultValue={0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              🏠 Owner
            </label>
            <input
              type="number"
              name="bawa_owner"
              step="any"
              min="0"
              defaultValue={0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              📦 Lainnya
            </label>
            <input
              type="number"
              name="bawa_lain"
              step="any"
              min="0"
              defaultValue={0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 italic">
          Isi kalau ada gabah yang dibawa pulang (tidak dijual).
        </p>
      </div>

      {/* ===== POTONG HUTANG ===== */}
      {totalHutang > 0 && !isMandiri && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="potong_hutang"
              defaultChecked={false}
              className="mt-1 w-5 h-5 accent-red-600"
            />
            <div className="flex-1">
              <div className="font-bold text-yellow-900 text-sm">
                💸 Potong Hutang dari Profit Penggarap
              </div>
              <div className="text-xs text-yellow-800 mt-1">
                Otomatis potong profit penggarap sebesar{" "}
                <strong>{formatRp(totalHutang)}</strong> (atau sampai profit
                habis).
              </div>
            </div>
          </label>
        </div>
      )}

      {/* ===== CATATAN ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catatan
        </label>
        <textarea
          name="catatan"
          rows={2}
          placeholder="Catatan tambahan (opsional)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* ===== MODAL MUSIM BARU ===== */}
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

            {errorMusim && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
                ❌ {errorMusim}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Musim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaMusimBaru}
                  onChange={(e) => setNamaMusimBaru(e.target.value)}
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
                  value={tanggalMulaiBaru}
                  onChange={(e) => setTanggalMulaiBaru(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={catatanMusimBaru}
                  onChange={(e) => setCatatanMusimBaru(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Bibit dari toko X"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimpanMusimClick}
                  disabled={loadingSimpanMusim}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg disabled:opacity-50"
                >
                  {loadingSimpanMusim ? "⏳ Menyimpan..." : "💾 Simpan Musim"}
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
