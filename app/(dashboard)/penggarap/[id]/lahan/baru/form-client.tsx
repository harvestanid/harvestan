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
  penggarapId: string;
  isSelf: boolean;
  gpsNama: string;
  gpsLuas: string;
  gpsKoordinat: string;
  gpsPolygon: string;
};

export function FormLahanBaru({
  penggarapId,
  isSelf,
  gpsNama,
  gpsLuas,
  gpsKoordinat,
  gpsPolygon,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [nama, setNama] = useState(gpsNama || "");
  const [luas, setLuas] = useState(gpsLuas || "");
  const [lokasiKoordinat, setLokasiKoordinat] = useState(gpsKoordinat || "");

  // Default tipe garap sesuai konteks
  const defaultTipe: TipeGarap = isSelf
    ? "mandiri"
    : "bagi_hasil_owner";

  const [tipeGarap, setTipeGarap] = useState<TipeGarap>(defaultTipe);
  const [namaOwnerExternal, setNamaOwnerExternal] = useState("");
  const [persenOwner, setPersenOwner] = useState(50);
  const [persenPenggarap, setPersenPenggarap] = useState(50);

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

      let polygon: any = null;
      if (gpsPolygon) {
        try {
          polygon = JSON.parse(gpsPolygon);
        } catch {
          polygon = null;
        }
      }

      const { error: insertError } = await supabase.from("lands").insert({
        user_id: user.id,
        penggarap_id: penggarapId,
        nama: nama.trim(),
        luas: luasNum,
        lokasi_koordinat: lokasiKoordinat.trim() || null,
        polygon,
        tipe_garap: tipeGarap,
        nama_owner_external:
          tipeGarap === "bagi_hasil_penggarap"
            ? namaOwnerExternal.trim() || null
            : null,
        persen_owner_default: tipeGarap === "mandiri" ? 0 : persenOwner,
        persen_penggarap_default: tipeGarap === "mandiri" ? 100 : persenPenggarap,
        is_demo: false,
      });

      if (insertError) {
        console.error("Insert lahan error:", insertError);
        throw new Error(insertError.message);
      }

      router.push(`/penggarap/${penggarapId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error simpan lahan:", err);
      setError(err.message || "Gagal menyimpan lahan");
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

      {isSelf && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
          <div className="text-xs text-[#2c5e2e] leading-relaxed">
            🌱 Kamu tambah lahan untuk <strong>diri sendiri</strong>. Pilih
            tipe garap di bawah ini:
          </div>
        </div>
      )}

      {/* Info Dasar */}
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
          📍 Format: latitude,longitude (bisa copy dari Google Maps)
        </p>
      </div>

      {/* Pembatas + TipeGarapPicker dengan KONTEKS */}
      <div className="pt-2 border-t border-gray-200">
        <TipeGarapPicker
          value={tipeGarap}
          onChange={setTipeGarap}
          konteks={isSelf ? "self" : "lain"}
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

      {/* Tombol */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
        >
          {loading ? "⏳ Menyimpan..." : "💾 Simpan Lahan"}
        </button>
        <Link
          href={`/penggarap/${penggarapId}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3 rounded-full transition-all"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
