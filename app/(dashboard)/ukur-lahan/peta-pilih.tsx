"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  hitungLuasPolygonM2,
  keGeoJSONPolygon,
  koordinatKeString,
} from "@/lib/utils/hitung-luas";

type Titik = { lat: number; lng: number };
type Penggarap = { id: string; nama: string };

type Props = {
  penggaraps: Penggarap[];
  penggarapId: string;
  setPenggarapId: (id: string) => void;
};

export default function PetaPilih({
  penggaraps,
  penggarapId,
  setPenggarapId,
}: Props) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [titik, setTitik] = useState<Titik[]>([]);
  const [luasM2, setLuasM2] = useState(0);
  const [luasHa, setLuasHa] = useState(0);
  const [kelilingM, setKelilingM] = useState(0);
  const [namaLahan, setNamaLahan] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [infoGPS, setInfoGPS] = useState("");
  const [sedangCariLokasi, setSedangCariLokasi] = useState(false);

  // ===== INIT MAP =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-6.2, 106.8],
        zoom: 18,
        zoomControl: true,
        maxZoom: 22,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
          maxZoom: 22,
          maxNativeZoom: 19,
        }
      ).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 22, maxNativeZoom: 19, opacity: 0.9 }
      ).addTo(map);

      polylineRef.current = L.polyline([], {
        color: "#f0b429",
        weight: 4,
        opacity: 0.95,
      }).addTo(map);

      polygonRef.current = L.polygon([], {
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.2,
        weight: 3,
      }).addTo(map);

      // Klik peta = tambah titik
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        setTitik((prev) => [...prev, { lat, lng }]);
      });

      mapRef.current = map;
      leafletRef.current = L;

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 300);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        leafletRef.current = null;
        polylineRef.current = null;
        polygonRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // ===== SYNC TITIK KE MAP =====
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const latlngs = titik.map((t) => [t.lat, t.lng] as [number, number]);

    polylineRef.current?.setLatLngs(latlngs);
    polygonRef.current?.setLatLngs(latlngs.length >= 3 ? latlngs : []);

    // Rebuild marker (jumlah titik bisa berubah karena undo/reset)
    if (markersRef.current.length !== titik.length) {
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      titik.forEach((t, i) => {
        const m = L.circleMarker([t.lat, t.lng], {
          radius: 6,
          color: "#fff",
          fillColor: i === 0 ? "#f59e0b" : "#a855f7",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        markersRef.current.push(m);
      });
    }

    const area = hitungLuasPolygonM2(titik);
    setLuasM2(area);
    setLuasHa(area / 10000);

    // Keliling
    let kel = 0;
    if (titik.length >= 2) {
      const R = 6378137;
      for (let i = 0; i < titik.length; i++) {
        const j = (i + 1) % titik.length;
        const lat1 = (titik[i].lat * Math.PI) / 180;
        const lat2 = (titik[j].lat * Math.PI) / 180;
        const dLat = lat2 - lat1;
        const dLng = ((titik[j].lng - titik[i].lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        kel += R * c;
      }
    }
    setKelilingM(kel);
  }, [titik]);

  function undoLast() {
    setTitik((prev) => prev.slice(0, -1));
  }

  function reset() {
    setTitik([]);
    setNamaLahan("");
    setPesanSukses(null);
    setPesanError(null);
    setInfoGPS("");
  }

  function cariLokasiSaya() {
    if (!navigator.geolocation) {
      setPesanError("Browser tidak mendukung GPS");
      return;
    }
    setSedangCariLokasi(true);
    setInfoGPS("🔄 Mencari lokasi Anda...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 18, { animate: true });
        }
        setInfoGPS(
          `✅ Lokasi ditemukan · akurasi ±${accuracy.toFixed(0)}m · tap peta untuk mulai`
        );
        setSedangCariLokasi(false);
      },
      (err) => {
        setPesanError("Gagal akses GPS: " + err.message);
        setInfoGPS("");
        setSedangCariLokasi(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }

  async function handleSimpan() {
    setPesanError(null);
    setPesanSukses(null);

    if (!penggarapId) {
      setPesanError("❌ Pilih penggarap dulu");
      return;
    }
    if (!namaLahan.trim()) {
      setPesanError("❌ Isi nama lahan dulu");
      return;
    }
    if (titik.length < 3) {
      setPesanError("❌ Minimal 3 titik untuk hitung luas");
      return;
    }
    if (luasM2 < 100) {
      setPesanError("❌ Luas terlalu kecil (< 100 m²)");
      return;
    }

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(penggarapId)) {
      setPesanError("❌ ID penggarap tidak valid");
      return;
    }

    const polygon = keGeoJSONPolygon(titik);
    const koordinatStr = koordinatKeString(titik[0]);

    setSedangSimpan(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis — login ulang");

      const payload = {
        user_id: user.id,
        penggarap_id: penggarapId,
        nama: namaLahan.trim(),
        luas: parseFloat(luasHa.toFixed(3)),
        lokasi_koordinat: koordinatStr,
        polygon,
      };

      const { error: errInsert } = await supabase.from("lands").insert(payload);

      if (errInsert) {
        const detail = [errInsert.code, errInsert.details, errInsert.hint]
          .filter(Boolean)
          .join(" | ");
        throw new Error(`${errInsert.message}${detail ? ` [${detail}]` : ""}`);
      }

      setPesanSukses(
        `✅ Lahan "${namaLahan}" berhasil disimpan! Luas: ${luasHa.toFixed(
          3
        )} Ha · ${titik.length} titik`
      );

      setTimeout(() => {
        router.push(`/penggarap/${penggarapId}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setPesanError("❌ Gagal simpan: " + (err.message || "Unknown error"));
    } finally {
      setSedangSimpan(false);
    }
  }

  const bisaSimpan =
    titik.length >= 3 && luasM2 >= 100 && namaLahan.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* INFO */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-4">
        <p className="text-xs text-blue-900 leading-relaxed">
          👆 <strong>Tap peta</strong> di setiap sudut batas lahan (minimal 3
          titik). Luas otomatis terhitung. Cocok untuk lahan luas atau
          memperkirakan dulu sebelum ke lapangan.
        </p>
      </div>

      {/* PILIH PENGGARAP */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-sm">
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          👨‍🌾 Pilih Penggarap <span className="text-red-500">*</span>
        </label>
        {penggaraps.length === 0 ? (
          <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3 text-xs text-[#2c5e2e]">
            Belum ada penggarap.{" "}
            <Link href="/penggarap/baru" className="font-bold underline">
              Tambah penggarap dulu
            </Link>
          </div>
        ) : (
          <select
            value={penggarapId}
            onChange={(e) => setPenggarapId(e.target.value)}
            className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          >
            <option value="">-- Pilih Penggarap --</option>
            {penggaraps.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-3 text-center shadow-sm">
          <div className="text-[9px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest mb-1">
            Luas
          </div>
          <div className="text-base md:text-xl font-bold text-[#2c5e2e] leading-none">
            {luasM2.toFixed(0)}
          </div>
          <div className="text-[9px] text-[#2c5e2e]/50 mt-0.5">
            m² · {luasHa.toFixed(4)} Ha
          </div>
        </div>
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-3 text-center shadow-sm">
          <div className="text-[9px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest mb-1">
            Keliling
          </div>
          <div className="text-base md:text-xl font-bold text-[#2c5e2e] leading-none">
            {kelilingM.toFixed(0)}
          </div>
          <div className="text-[9px] text-[#2c5e2e]/50 mt-0.5">meter</div>
        </div>
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-3 text-center shadow-sm">
          <div className="text-[9px] text-[#2c5e2e]/60 font-bold uppercase tracking-widest mb-1">
            Titik
          </div>
          <div className="text-base md:text-xl font-bold text-[#2c5e2e] leading-none">
            {titik.length}
          </div>
          <div className="text-[9px] text-[#2c5e2e]/50 mt-0.5">sudut</div>
        </div>
      </div>

      {/* INFO GPS */}
      {infoGPS && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
          <p className="text-[11px] text-[#2c5e2e] font-semibold">{infoGPS}</p>
        </div>
      )}

      {/* MAP */}
      <div className="relative bg-white border-2 border-[#2c5e2e]/10 rounded-3xl overflow-hidden shadow-sm">
        <div
          ref={containerRef}
          className="w-full h-[320px] md:h-[420px] bg-[#f5f7f3]"
          style={{ zIndex: 0 }}
        />
        <button
          onClick={cariLokasiSaya}
          disabled={sedangCariLokasi}
          title="Ke lokasi saya"
          className="absolute bottom-3 right-3 z-[1100] w-11 h-11 rounded-full bg-white shadow-lg border-2 border-[#2c5e2e]/20 flex items-center justify-center text-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {sedangCariLokasi ? "⏳" : "🎯"}
        </button>
        <div className="absolute top-3 left-3 z-[1100] bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-[10px] font-bold text-[#2c5e2e] shadow-md border border-[#2c5e2e]/10">
          👆 Tap peta untuk tandai sudut
        </div>
      </div>

      {/* TOMBOL */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={undoLast}
          disabled={titik.length === 0}
          className="flex-1 min-w-[120px] bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm px-5 py-3.5 rounded-full border-2 border-[#f0b429]/40 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          ↩️ Hapus Titik
        </button>
        <button
          onClick={reset}
          disabled={titik.length === 0}
          className="flex-1 min-w-[120px] bg-white hover:bg-red-50 text-red-600 font-bold text-sm px-5 py-3.5 rounded-full border-2 border-red-200 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          🔄 Reset
        </button>
      </div>

      {/* FORM SIMPAN */}
      {titik.length >= 3 && luasM2 >= 100 && (
        <div className="bg-white border-4 border-[#f0b429] rounded-3xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-lg flex-shrink-0">
              💾
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
                Simpan Lahan
              </div>
              <div className="text-[10px] text-[#2c5e2e]/60">
                {luasHa.toFixed(3)} Ha · {titik.length} titik
              </div>
            </div>
          </div>

          <label className="block text-xs font-medium text-[#2c5e2e] mb-1">
            Nama Lahan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={namaLahan}
            onChange={(e) => setNamaLahan(e.target.value)}
            placeholder="Contoh: Sawah Utama"
            className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          />

          {pesanError && (
            <div className="mt-2 bg-red-50 border-2 border-red-200 rounded-xl p-2.5">
              <p className="text-[11px] text-red-700 font-semibold break-words">
                {pesanError}
              </p>
            </div>
          )}

          {pesanSukses && (
            <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-xl p-2.5">
              <p className="text-[11px] text-green-800 font-semibold">
                {pesanSukses}
              </p>
            </div>
          )}

          <button
            onClick={handleSimpan}
            disabled={sedangSimpan || !bisaSimpan}
            className="w-full mt-3 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
          >
            {sedangSimpan ? "⏳ Menyimpan..." : "💾 Simpan ke Penggarap"}
          </button>
        </div>
      )}

      {titik.length > 0 && titik.length < 3 && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
          <p className="text-[11px] text-[#2c5e2e] font-semibold">
            ⏳ Minimal 3 titik. Sekarang {titik.length} titik.
          </p>
        </div>
      )}

      {/* TIPS */}
      <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-3xl p-4">
        <div className="text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          💡 Tips Pilih di Peta
        </div>
        <ul className="text-[11px] md:text-xs text-[#2c5e2e]/80 space-y-1.5 leading-relaxed">
          <li>• Zoom in dulu (cubit/scroll) supaya tap-nya presisi</li>
          <li>• Klik tombol 🎯 kalau peta gak di lokasi Anda</li>
          <li>• Tap mengikuti urutan batas lahan (searah jarum jam)</li>
          <li>• Minimal 3 titik, makin banyak makin presisi</li>
          <li>• Klik ↩️ Hapus Titik kalau ada yang salah tap</li>
        </ul>
      </div>
    </div>
  );
}
