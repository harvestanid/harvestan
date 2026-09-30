"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  TipeGarapPicker,
  type TipeGarap,
} from "@/components/tipe-garap-picker";

type Props = {
  landId: string;
  penggarapId: string;
  isSelf: boolean;
  initial: {
    nama: string;
    luas: number;
    lokasi_koordinat: string;
    tipe_garap: string;
    nama_owner_external: string;
    persen_owner_default: number;
    persen_penggarap_default: number;
  };
};

export function FormEditLahan({
  landId,
  penggarapId,
  isSelf,
  initial,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [nama, setNama] = useState(initial.nama);
  const [luas, setLuas] = useState(initial.luas.toString());
  const [lokasiKoordinat, setLokasiKoordinat] = useState(
    initial.lokasi_koordinat
  );

  const [tipeGarap, setTipeGarap] = useState<TipeGarap>(
    (initial.tipe_garap as TipeGarap) || "bagi_hasil_owner"
  );
  const [namaOwnerExternal, setNamaOwnerExternal] = useState(
    initial.nama_owner_external
  );
  const [persenOwner, setPersenOwner] = useState(initial.persen_owner_default);
  const [persenPenggarap, setPersenPenggarap] = useState(
    initial.persen_penggarap_default
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) {
      setError("Nama lahan wajib diisi");
      return;
    }

    const luasNum = parseFloat(luas);
    if (isNaN(luasNum) || luasNum <= 0) {
      setError("Luas lahan harus lebih dari 0");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis. Silakan login ulang.");

      const { error: updateError } = await supabase
        .from("lands")
        .update({
          nama: nama.trim(),
          luas: luasNum,
          lokasi_koordinat: lokasiKoordinat.trim() || null,
          tipe_garap: tipeGarap,
          nama_owner_external:
            tipeGarap === "bagi_hasil_penggarap"
              ? namaOwnerExternal.trim() || null
              : null,
          persen_owner_default: tipeGarap === "mandiri" ? 0 : persenOwner,
          persen_penggarap_default:
            tipeGarap === "mandiri" ? 100 : persenPenggarap,
        })
        .eq("id", landId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update lahan error:", updateError);
        throw new Error(updateError.message);
      }

      router.push(`/penggarap/${penggarapId}/lahan/${landId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error update lahan:", err);
      setError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 space-y-5"
    >
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
        <div className="text-xs text-[#2c5e2e] leading-relaxed">
          💡 Ubah tipe garap di bawah ini. Perubahan <strong>tidak</strong>{" "}
          mempengaruhi data panen yang sudah ada — hanya berlaku untuk input
          panen baru.
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Lahan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          placeholder="Contoh: Sawah Utama, Kebun Belakang"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Luas (Hektar) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={luas}
          onChange={(e) => setLuas(e.target.value)}
          step="0.001"
          min="0.001"
          required
          placeholder="Contoh: 1.5"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Koordinat GPS (opsional)
        </label>
        <input
          type="text"
          value={lokasiKoordinat}
          onChange={(e) => setLokasiKoordinat(e.target.value)}
          placeholder="Contoh: -6.994303,112.174348"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          📍 Format: latitude,longitude (jangan lupa tanda minus untuk lintang
          selatan)
        </p>
      </div>

      {/* Pembatas + TipeGarapPicker konteks "semua" untuk edit */}
      <div className="pt-2 border-t border-gray-200">
        <TipeGarapPicker
          value={tipeGarap}
          onChange={setTipeGarap}
          konteks="semua"
          namaOwnerExternal={namaOwnerExternal}
          onNamaOwnerExternalChange={setNamaOwnerExternal}
          persenOwner={persenOwner}
          persenPenggarap={persenPenggarap}
          onPersenChange={(o, p) => {
            setPersenOwner(o);
            setPersenPenggarap(p);
          }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
        >
          {loading ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
        </button>
        <Link
          href={`/penggarap/${penggarapId}/lahan/${landId}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3 rounded-full transition-all"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
