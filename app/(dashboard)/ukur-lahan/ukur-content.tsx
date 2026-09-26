"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  hitungLuasPolygonM2,
  hitungTitikTengah,
  hitungJarakMeter,
  keGeoJSONPolygon,
  koordinatKeString,
  m2KeHa,
  type Coordinate,
} from "@/lib/utils/hitung-luas";

const PetaUkur = dynamic(() => import("@/components/peta-ukur"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Memuat peta...</div>
    </div>
  ),
});

type Penggarap = {
  id: string;
  nama: string;
};

type Props = {
  penggarapIdFromURL: string | null;
  mode: "new" | "edit";
  landId: string | null;
  namaLama?: string | null;
};

export default function UkurLahanContent({
  penggarapIdFromURL,
  mode,
  landId,
  namaLama,
}: Props) {
  const router = useRouter();

  const [penggarapId, setPenggarapId] = useState(penggarapIdFromURL || "");
  const [penggaraps, setPenggaraps] = useState<Penggarap[]>([]);
  const [loadingPenggaraps, setLoadingPenggaraps] = useState(false);

  const [nama, setNama] = useState(namaLama || "");
  const [titik, setTitik] = useState<Coordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [posisiSekarang, setPosisiSekarang] = useState<Coordinate | null>(null);
  const [pesanError, setPesanError] = useState("");
  const [infoGPS, setInfoGPS] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  const luasM2 = hitungLuasPolygonM2(titik);
  const luasHa = m2KeHa(luasM2);
  const titikTengah = titik.length > 0 ? hitungTitikTengah(titik) : null;

  // Load penggarap (kalau tidak ada penggarapId dari URL)
  useEffect(() => {
    async function load() {
      if (penggarapIdFromURL) return;

      setLoadingPenggaraps(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("penggaraps")
        .select("id, nama")
        .eq("user_id", user.id)
        .order("nama");

      setPenggaraps(data || []);
      setLoadingPenggaraps(false);
    }
    load();
  }, [penggarapIdFromURL]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  function mulaiTracking() {
    if (!penggarapId) {
      alert("❌ Pilih penggarap dulu");
      return;
    }

    if (!navigator.geolocation) {
      setPesanError("❌ Browser tidak mendukung GPS");
      return;
    }

    setTitik([]);
    setPesanError("");
    setInfoGPS("🔄 Mencari sinyal GPS...");
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        const titikBaru: Coordinate = { lat: latitude, lng: longitude };

        setAccuracy(acc);
        setPosisiSekarang(titikBaru);

        if (acc > 20) {
          setInfoGPS(
            `⚠️ Akurasi rendah (${acc.toFixed(0)}m). Cari area terbuka.`
          );
          return;
        }

        setTitik((prev) => {
          if (prev.length === 0) {
            setInfoGPS(`✅ Tracking aktif (akurasi ${acc.toFixed(0)}m)`);
            return [titikBaru];
          }

          const terakhir = prev[prev.length - 1];
          const jarak = hitungJarakMeter(terakhir, titikBaru);

          if (jarak < 3) return prev;
          if (jarak > 50) {
            setInfoGPS(`⚠️ Loncat ${jarak.toFixed(0)}m. Sinyal glitch.`);
            return prev;
          }

          setInfoGPS(`✅ ${prev.length + 1} titik (akurasi ${acc.toFixed(0)}m)`);
          return [...prev, titikBaru];
        });
      },
      (err) => {
        console.error("GPS Error:", err);
        setPesanError(
          `❌ GPS Error: ${err.message}\n\nPastikan:\n1. GPS HP aktif\n2. Izin lokasi diberikan\n3. Berada di area terbuka`
        );
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 2000,
      }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setInfoGPS("⏸️ Tracking dihentikan");
  }

  function resetTracking() {
    stopTracking();
    setTitik([]);
    setAccuracy(null);
    setPosisiSekarang(null);
    setInfoGPS("");
    setPesanError("");
  }

  async function handleSimpan() {
    if (!nama.trim()) {
      alert("❌ Isi nama lahan dulu");
      return;
    }
    if (!penggarapId) {
      alert("❌ Pilih penggarap dulu");
      return;
    }
    if (titik.length < 3) {
      alert("❌ Minimal 3 titik GPS untuk hitung luas");
      return;
    }
    if (luasM2 < 100) {
      alert("❌ Luas terlalu kecil (< 100 m²). Coba ukur ulang.");
      return;
    }

    const polygon = keGeoJSONPolygon(titik);
    const koordinatStr = titikTengah ? koordinatKeString(titikTengah) : "";

    // ===== MODE EDIT: Update lahan lama =====
    if (mode === "edit" && landId) {
      if (
        !confirm(
          `Update lahan dengan data baru?\n\n` +
            `Nama: ${nama}\n` +
            `Luas baru: ${luasHa.toFixed(3)} Ha\n` +
            `Titik GPS: ${titik.length}\n\n` +
            `Riwayat panen & data lain tetap.`
        )
      )
        return;

      setSedangSimpan(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { error } = await supabase
          .from("lands")
          .update({
            nama: nama.trim(),
            luas: parseFloat(luasHa.toFixed(3)),
            lokasi_koordinat: koordinatStr,
            polygon: polygon,
          })
          .eq("id", landId)
          .eq("user_id", user.id);

        if (error) throw error;

        alert(
          `✅ Lahan "${nama}" berhasil diupdate!\n\nLuas baru: ${luasHa.toFixed(3)} Ha`
        );
        router.push(`/penggarap/${penggarapId}/lahan/${landId}`);
        router.refresh();
      } catch (err: any) {
        console.error("Error update lahan:", err);
        alert("❌ Gagal update: " + (err.message || "Unknown error"));
      } finally {
        setSedangSimpan(false);
      }
      return;
    }

    // ===== MODE NEW: Redirect ke form tambah lahan =====
    const params = new URLSearchParams({
      gps_nama: nama.trim(),
      gps_luas: luasHa.toFixed(3),
      gps_koordinat: koordinatStr,
      gps_polygon: JSON.stringify(polygon),
    });

    router.push(`/penggarap/${penggarapId}/lahan/baru?${params.toString()}`);
  }

  // ===== TAMPILAN 1: BELUM PILIH PENGGARAP =====
  if (!penggarapId) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            📍 Ukur Lahan GPS
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Ukur luas lahan dengan jalan keliling — otomatis hitung luas &
            koordinat
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h2 className="font-bold text-yellow-900 text-sm mb-1">
                Akurasi GPS
              </h2>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>
                  📏 Akurasi: <strong>5-20 meter</strong> tergantung sinyal
                </li>
                <li>
                  ✅ <strong>Cocok</strong> untuk lahan &gt;0.5 Ha
                </li>
                <li>
                  ❌ <strong>Tidak cocok</strong> untuk lahan &lt;0.1 Ha
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Penggarap <span className="text-red-500">*</span>
          </label>

          {loadingPenggaraps ? (
            <div className="text-sm text-gray-500 italic">Memuat...</div>
          ) : penggaraps.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Belum ada penggarap.{" "}
              <Link href="/penggarap/baru" className="font-bold underline">
                Tambah penggarap dulu
              </Link>
            </div>
          ) : (
            <select
              value={penggarapId}
              onChange={(e) => setPenggarapId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Pilih Penggarap --</option>
              {penggaraps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          )}

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <strong>📖 Cara Menggunakan:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-0.5">
              <li>Pilih penggarap di atas</li>
              <li>Klik "Mulai Ukur" yang muncul</li>
              <li>Jalan keliling lahan</li>
              <li>Klik "Selesai Ukur" kalau sudah keliling</li>
              <li>Isi nama lahan → Simpan</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ===== TAMPILAN 2: TRACKING =====
  const isEditMode = mode === "edit" && landId;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="font-bold text-gray-900">
              {isEditMode ? "🔄 Ukur Ulang Lahan" : "📍 Ukur Lahan GPS"}
            </h1>
            <p className="text-xs text-gray-500">
              {isEditMode
                ? "Jalan keliling lahan untuk update luas"
                : "Jalan keliling lahan untuk ukur luas"}
            </p>
          </div>
        </div>
        {titik.length > 0 && (
          <button
            onClick={resetTracking}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            🔄 Reset
          </button>
        )}
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800 flex-shrink-0">
          <div className="flex items-start gap-2 max-w-3xl mx-auto">
            <span className="text-base flex-shrink-0">ℹ️</span>
            <div>
              <strong>Mode Update Lahan:</strong> Setelah selesai ukur, luas &
              polygon lahan ini akan <strong>diupdate</strong>. Nama, riwayat
              panen, dan data lain tetap.
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 flex-shrink-0">
        <div className="flex items-start gap-2 max-w-3xl mx-auto">
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <strong>Akurasi GPS:</strong> 5-20 meter tergantung sinyal.
            <br />
            ✅ Cocok untuk lahan &gt;0.5 Ha &middot; ❌ Tidak cocok untuk lahan
            &lt;0.1 Ha
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <PetaUkur
          titik={titik}
          posisiSekarang={posisiSekarang}
          isTracking={isTracking}
        />

        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] space-y-2">
          <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">
                Status GPS
              </span>
              {accuracy !== null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    accuracy <= 10
                      ? "bg-green-100 text-green-800"
                      : accuracy <= 20
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  ±{accuracy.toFixed(0)}m
                </span>
              )}
            </div>
            <div className="text-sm text-gray-800">
              {infoGPS || "Tekan Mulai untuk tracking"}
            </div>
          </div>

          {titik.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Titik GPS</div>
                  <div className="font-bold text-gray-900 text-lg">
                    {titik.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Luas (sementara)</div>
                  <div className="font-bold text-green-700 text-lg">
                    {luasHa.toFixed(3)} Ha
                  </div>
                </div>
              </div>
              {luasM2 > 0 && (
                <div className="text-[10px] text-gray-500 mt-1 text-center">
                  {Math.round(luasM2).toLocaleString("id-ID")} m²
                </div>
              )}
            </div>
          )}

          {pesanError && (
            <div className="bg-red-50 rounded-xl shadow-lg p-3 border-2 border-red-300">
              <div className="text-xs text-red-800 whitespace-pre-line">
                {pesanError}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000]">
          {!isTracking && titik.length === 0 && (
            <button
              onClick={mulaiTracking}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-2xl transition text-lg"
            >
              📍 Mulai Ukur
            </button>
          )}

          {isTracking && (
            <button
              onClick={stopTracking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-2xl transition text-lg"
            >
              ⏸️ Selesai Ukur
            </button>
          )}

          {!isTracking && titik.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={mulaiTracking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-2xl transition"
              >
                ▶️ Lanjut Ukur
              </button>
              <div className="bg-white rounded-xl p-3 shadow-2xl border border-gray-200">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Lahan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Sawah Utama"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSimpan}
                  disabled={sedangSimpan || !nama.trim() || titik.length < 3}
                  className={`w-full mt-2 font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEditMode
                      ? "bg-blue-700 hover:bg-blue-800 text-white"
                      : "bg-green-700 hover:bg-green-800 text-white"
                  }`}
                >
                  {sedangSimpan
                    ? "⏳ Menyimpan..."
                    : isEditMode
                    ? "🔄 Update Lahan Ini"
                    : "💾 Simpan & Lanjut"}
                </button>
                {isEditMode && (
                  <p className="text-[10px] text-blue-700 mt-1 text-center">
                    Luas & polygon akan diupdate. Riwayat panen tetap.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
