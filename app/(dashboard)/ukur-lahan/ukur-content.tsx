"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  hitungJarakMeter,
  hitungLuasPolygonM2,
  keGeoJSONPolygon,
  koordinatKeString,
} from "@/lib/utils/hitung-luas";
import PetaPilih from "./peta-pilih";

type Point = { lat: number; lng: number; acc: number };
type Penggarap = { id: string; nama: string };
type Mode = "gps" | "peta";

// ===================== KONFIGURASI =====================
const JARAK_MIN_METER = 10;      // titik ungu baru tiap 10 m jalan
const AKURASI_MAKS_METER = 40;   // >40m ditolak, sisanya ditahan Kalman
const GLITCH_LONCAT_METER = 40;  // loncatan >40m diabaikan (anti-glitch)
const MIN_FIX_SEBELUM_TITIK = 3; // tunggu 3 fix stabil utk titik pertama
const Q_PROSES = 1.5;            // process noise Kalman (m/s^2)^2
// =======================================================

const M_PER_DEG_LAT = 111320;

function mPerDegLng(lat: number): number {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

class KalmanAxis {
  p = 0;
  v = 0;
  P00 = 1;
  P01 = 0;
  P10 = 0;
  P11 = 1;
  initialized = false;

  init(pos: number, acc: number) {
    this.p = pos;
    this.v = 0;
    this.P00 = acc * acc;
    this.P01 = 0;
    this.P10 = 0;
    this.P11 = 100;
    this.initialized = true;
  }

  predict(dt: number) {
    const { p, v, P00, P01, P10, P11 } = this;
    this.p = p + v * dt;
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt3 * dt;
    this.P00 = P00 + dt * (P01 + P10) + dt2 * P11 + (Q_PROSES * dt4) / 4;
    this.P01 = P01 + dt * P11 + (Q_PROSES * dt3) / 2;
    this.P10 = P10 + dt * P11 + (Q_PROSES * dt3) / 2;
    this.P11 = P11 + Q_PROSES * dt2;
  }

  update(meas: number, acc: number) {
    const R = Math.max(acc, 1.5) ** 2;
    const y = meas - this.p;
    const S = this.P00 + R;
    const K0 = this.P00 / S;
    const K1 = this.P10 / S;
    this.p = this.p + K0 * y;
    this.v = this.v + K1 * y;
    const p00 = this.P00;
    const p01 = this.P01;
    this.P00 = p00 - K0 * p00;
    this.P01 = p01 - K0 * p01;
    this.P10 = this.P10 - K1 * p00;
    this.P11 = this.P11 - K1 * p01;
  }
}

class KalmanGPS {
  kx = new KalmanAxis();
  ky = new KalmanAxis();
  originLat = 0;
  originLng = 0;
  mLat = M_PER_DEG_LAT;
  mLng = 1;
  originSet = false;

  setOrigin(lat: number, lng: number) {
    this.originLat = lat;
    this.originLng = lng;
    this.mLat = M_PER_DEG_LAT;
    this.mLng = mPerDegLng(lat);
    this.originSet = true;
  }

  reset() {
    this.kx = new KalmanAxis();
    this.ky = new KalmanAxis();
  }

  get ready() {
    return this.kx.initialized && this.ky.initialized;
  }
}

export default function UkurContent() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("gps");
  const [penggarapId, setPenggarapId] = useState("");
  const [penggaraps, setPenggaraps] = useState<Penggarap[]>([]);
  const [loadingPenggaraps, setLoadingPenggaraps] = useState(false);

  const [points, setPoints] = useState<Point[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [luasM2, setLuasM2] = useState(0);
  const [luasHa, setLuasHa] = useState(0);
  const [kelilingM, setKelilingM] = useState(0);
  const [akurasiNow, setAkurasiNow] = useState<number | null>(null);
  const [infoGPS, setInfoGPS] = useState("");
  const [sedangSimpan, setSedangSimpan] = useState(false);

  const [namaLahan, setNamaLahan] = useState("");
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [pesanErrorSimpan, setPesanErrorSimpan] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const closingRef = useRef<any>(null);
  const markerPtsRef = useRef<any[]>([]);
  const markerNowRef = useRef<any>(null);
  const accCircleRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const followRef = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const kalmanRef = useRef<KalmanGPS>(new KalmanGPS());
  const pointsRef = useRef<Point[]>([]);
  const posisiRef = useRef<Point | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const fixCountRef = useRef(0);
  const firstViewDoneRef = useRef(false);

  const bisaSimpan = !isTracking && points.length >= 3 && luasM2 >= 100;

  function hitungKeliling(pts: Point[]): number {
    if (pts.length < 2) return 0;
    const R = 6378137;
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const lat1 = (pts[i].lat * Math.PI) / 180;
      const lat2 = (pts[j].lat * Math.PI) / 180;
      const dLat = lat2 - lat1;
      const dLng = ((pts[j].lng - pts[i].lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  }

  function updateStats(pts: Point[]) {
    const area = hitungLuasPolygonM2(pts);
    setLuasM2(area);
    setLuasHa(area / 10000);
    setKelilingM(hitungKeliling(pts));
  }

  // ===================== LOAD PENGGARAP =====================
  useEffect(() => {
    async function load() {
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
  }, [router]);

  // ===================== INIT MAP (sekali) =====================
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode !== "gps") return;
    if (mapRef.current) return;
    if (!containerRef.current) return;

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
        weight: 5,
        opacity: 0.95,
      }).addTo(map);

      closingRef.current = L.polyline([], {
        color: "#f0b429",
        weight: 3,
        dashArray: "6 6",
        opacity: 0.7,
      }).addTo(map);

      map.on("dragstart", () => {
        followRef.current = false;
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
        closingRef.current = null;
        markerPtsRef.current = [];
        markerNowRef.current = null;
        accCircleRef.current = null;
      }
    };
  }, [mode]);

  // ===================== SYNC VISUAL TITIK UNGU =====================
  useEffect(() => {
    if (mode !== "gps") return;
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

    polylineRef.current?.setLatLngs(latlngs);
    if (points.length >= 3) {
      closingRef.current?.setLatLngs([
        latlngs[latlngs.length - 1],
        latlngs[0],
      ]);
    } else {
      closingRef.current?.setLatLngs([]);
    }

    if (points.length < markerPtsRef.current.length) {
      markerPtsRef.current.forEach((m) => map.removeLayer(m));
      markerPtsRef.current = [];
    }
    for (let i = markerPtsRef.current.length; i < points.length; i++) {
      const m = L.circleMarker([points[i].lat, points[i].lng], {
        radius: 5,
        color: "#fff",
        fillColor: "#a855f7",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      markerPtsRef.current.push(m);
    }
  }, [points, mode]);

  // ===================== GPS: START =====================
  function startTracking() {
    if (!penggarapId) {
      setError("❌ Pilih penggarap dulu");
      return;
    }
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung GPS");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setError(null);
    setPesanSukses(null);
    setPesanErrorSimpan(null);
    setInfoGPS("🔄 Mencari sinyal GPS...");
    setIsTracking(true);

    followRef.current = true;
    kalmanRef.current.reset();
    fixCountRef.current = 0;
    lastTsRef.current = null;
    firstViewDoneRef.current = false;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        setAkurasiNow(acc);

        if (acc > AKURASI_MAKS_METER) {
          setInfoGPS(
            `⚠️ Akurasi ${acc.toFixed(0)}m > ${AKURASI_MAKS_METER}m — ditahan. Cari langit terbuka.`
          );
          return;
        }

        const k = kalmanRef.current;

        if (!k.originSet) {
          k.setOrigin(pos.coords.latitude, pos.coords.longitude);
        }
        const mx = (pos.coords.longitude - k.originLng) * k.mLng;
        const my = (pos.coords.latitude - k.originLat) * k.mLat;

        const now = pos.timestamp || Date.now();
        const dt = lastTsRef.current
          ? Math.min(Math.max((now - lastTsRef.current) / 1000, 0.1), 5)
          : 1;
        lastTsRef.current = now;

        if (!k.ready) {
          k.kx.init(mx, acc);
          k.ky.init(my, acc);
        } else {
          k.kx.predict(dt);
          k.ky.predict(dt);
          k.kx.update(mx, acc);
          k.ky.update(my, acc);
        }
        fixCountRef.current += 1;

        const lat = k.originLat + k.ky.p / k.mLat;
        const lng = k.originLng + k.kx.p / k.mLng;
        const filtered: Point = { lat, lng, acc };
        posisiRef.current = filtered;

        const speed = Math.hypot(k.kx.v, k.ky.v);

        const map = mapRef.current;
        const L = leafletRef.current;
        if (map && L) {
          if (!markerNowRef.current) {
            markerNowRef.current = L.circleMarker([lat, lng], {
              radius: 9,
              color: "#fff",
              fillColor: "#2c5e2e",
              fillOpacity: 1,
              weight: 3,
            }).addTo(map);
            accCircleRef.current = L.circle([lat, lng], {
              radius: acc,
              color: "#2c5e2e",
              weight: 1,
              opacity: 0.4,
              fillColor: "#2c5e2e",
              fillOpacity: 0.08,
            }).addTo(map);
          } else {
            markerNowRef.current.setLatLng([lat, lng]);
            markerNowRef.current.setStyle({ fillColor: "#2c5e2e" });
            accCircleRef.current.setLatLng([lat, lng]);
            accCircleRef.current.setRadius(acc);
          }

          if (!firstViewDoneRef.current) {
            firstViewDoneRef.current = true;
            map.setView([lat, lng], 18, { animate: true });
          } else if (followRef.current) {
            map.panTo([lat, lng], { animate: false });
          }
        }

        const prev = pointsRef.current;
        const last = prev[prev.length - 1];

        if (!last) {
          if (fixCountRef.current < MIN_FIX_SEBELUM_TITIK) {
            setInfoGPS(
              `🔄 Menstabilkan GPS (${fixCountRef.current}/${MIN_FIX_SEBELUM_TITIK}) · acc ±${acc.toFixed(0)}m`
            );
            return;
          }
          const updated = [filtered];
          pointsRef.current = updated;
          setPoints(updated);
          updateStats(updated);
          setInfoGPS(`✅ Titik 1 ditandai · acc ±${acc.toFixed(0)}m`);
          return;
        }

        const dist = hitungJarakMeter(last, filtered);

        if (dist > GLITCH_LONCAT_METER) {
          setInfoGPS(
            `⚠️ Loncatan ${dist.toFixed(0)}m diabaikan (glitch) · acc ±${acc.toFixed(0)}m`
          );
          return;
        }

        if (dist < JARAK_MIN_METER) {
          setInfoGPS(
            `🚶 ${dist.toFixed(1)}m / ${JARAK_MIN_METER}m · acc ±${acc.toFixed(0)}m · v ${speed.toFixed(1)} m/s`
          );
          return;
        }

        const updated = [...prev, filtered];
        pointsRef.current = updated;
        setPoints(updated);
        updateStats(updated);
        setInfoGPS(
          `✅ Titik ${updated.length} · +${dist.toFixed(1)}m · acc ±${acc.toFixed(0)}m`
        );
      },
      (err) => {
        setError(err.message || "Gagal akses GPS");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    watchIdRef.current = id;
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setInfoGPS("⏸️ Tracking dihentikan — isi nama lalu simpan");
    if (markerNowRef.current) {
      markerNowRef.current.setStyle({ fillColor: "#6b7280" });
    }
  }

  function reset() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const map = mapRef.current;
    if (map) {
      markerPtsRef.current.forEach((m) => map.removeLayer(m));
      markerPtsRef.current = [];
      if (markerNowRef.current) {
        map.removeLayer(markerNowRef.current);
        markerNowRef.current = null;
      }
      if (accCircleRef.current) {
        map.removeLayer(accCircleRef.current);
        accCircleRef.current = null;
      }
      polylineRef.current?.setLatLngs([]);
      closingRef.current?.setLatLngs([]);
    }
    pointsRef.current = [];
    setPoints([]);
    setLuasM2(0);
    setLuasHa(0);
    setKelilingM(0);
    setAkurasiNow(null);
    setError(null);
    setInfoGPS("");
    setNamaLahan("");
    setPesanSukses(null);
    setPesanErrorSimpan(null);
    setIsTracking(false);
    followRef.current = true;
    kalmanRef.current.reset();
    fixCountRef.current = 0;
    lastTsRef.current = null;
    firstViewDoneRef.current = false;
  }

  function undoLast() {
    const updated = pointsRef.current.slice(0, -1);
    pointsRef.current = updated;
    setPoints(updated);
    updateStats(updated);
  }

  function centerMap() {
    followRef.current = true;
    const map = mapRef.current;
    if (!map) return;
    const p = posisiRef.current ?? pointsRef.current[pointsRef.current.length - 1];
    if (p) {
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 18), {
        animate: true,
      });
    }
  }

  // ===================== SIMPAN LAHAN (GPS MODE) =====================
  async function handleSimpan() {
    setPesanErrorSimpan(null);
    setPesanSukses(null);

    if (!penggarapId) {
      setPesanErrorSimpan("❌ Pilih penggarap dulu");
      return;
    }
    if (!namaLahan.trim()) {
      setPesanErrorSimpan("❌ Isi nama lahan dulu");
      return;
    }
    if (points.length < 3) {
      setPesanErrorSimpan("❌ Minimal 3 titik GPS untuk hitung luas");
      return;
    }
    if (luasM2 < 100) {
      setPesanErrorSimpan("❌ Luas terlalu kecil (< 100 m²). Coba ukur ulang.");
      return;
    }

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(penggarapId)) {
      setPesanErrorSimpan(
        "❌ ID penggarap tidak valid. Muat ulang halaman lalu pilih ulang penggarap."
      );
      return;
    }

    const polygon = keGeoJSONPolygon(points);
    const koordinatStr = koordinatKeString(points[0]);

    setSedangSimpan(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis — silakan login ulang");

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
        console.error("Supabase insert error:", JSON.stringify(errInsert));
        const detail = [errInsert.code, errInsert.details, errInsert.hint]
          .filter(Boolean)
          .join(" | ");
        throw new Error(
          `${errInsert.message}${detail ? ` [${detail}]` : ""}`
        );
      }

      setPesanSukses(
        `✅ Lahan "${namaLahan}" berhasil disimpan! Luas: ${luasHa.toFixed(
          3
        )} Ha · ${points.length} titik`
      );

      setTimeout(() => {
        router.push(`/penggarap/${penggarapId}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error("Error simpan lahan:", err);
      setPesanErrorSimpan(
        "❌ Gagal simpan: " + (err.message || "Unknown error")
      );
    } finally {
      setSedangSimpan(false);
    }
  }

  // ===================== RENDER =====================
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-5 md:p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0b429]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4 mb-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#f0b429] flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 shadow-md">
            📍
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
              Ukur Lahan
            </h1>
            <p className="text-[10px] md:text-xs text-[#f0b429] font-bold uppercase tracking-widest mt-0.5">
              {mode === "gps" ? "Jalan Keliling Batas Lahan" : "Pilih Titik di Peta"}
            </p>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="relative grid grid-cols-2 gap-2 bg-black/20 backdrop-blur rounded-full p-1 mb-4">
          <button
            onClick={() => setMode("gps")}
            className={`py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              mode === "gps"
                ? "bg-[#f0b429] text-[#2c5e2e] shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            🚶 Jalan Keliling
          </button>
          <button
            onClick={() => setMode("peta")}
            className={`py-2.5 rounded-full text-xs md:text-sm font-bold transition-all ${
              mode === "peta"
                ? "bg-[#f0b429] text-[#2c5e2e] shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            🖱️ Pilih di Peta
          </button>
        </div>

        {mode === "gps" && (
          <p className="relative text-[11px] md:text-sm text-white/80 leading-relaxed mb-4">
            Tekan <strong className="text-[#f0b429]">Mulai Ukur</strong>, lalu
            jalan keliling batas lahan Anda. Titik otomatis tercatat tiap{" "}
            {JARAK_MIN_METER} meter.
          </p>
        )}

        {mode === "gps" && (
          <div className="relative grid grid-cols-3 gap-2 md:gap-3">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-[9px] md:text-[10px] text-[#f0b429] font-bold uppercase tracking-widest mb-1">
                Luas
              </div>
              <div className="text-base md:text-xl font-bold text-white tracking-tight leading-none">
                {luasM2.toFixed(0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-white/60 mt-0.5">
                m² · {luasHa.toFixed(4)} Ha
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-[9px] md:text-[10px] text-[#f0b429] font-bold uppercase tracking-widest mb-1">
                Keliling
              </div>
              <div className="text-base md:text-xl font-bold text-white tracking-tight leading-none">
                {kelilingM.toFixed(0)}
              </div>
              <div className="text-[9px] md:text-[10px] text-white/60 mt-0.5">
                meter
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-[9px] md:text-[10px] text-[#f0b429] font-bold uppercase tracking-widest mb-1">
                Titik
              </div>
              <div className="text-base md:text-xl font-bold text-white tracking-tight leading-none">
                {points.length}
              </div>
              <div className="text-[9px] md:text-[10px] text-white/60 mt-0.5">
                {akurasiNow !== null ? `±${akurasiNow.toFixed(0)}m` : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MODE GPS ============ */}
      <div hidden={mode !== "gps"} className="space-y-4">
        {/* PILIH PENGGARAP */}
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-sm">
          <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
            👨‍🌾 Pilih Penggarap <span className="text-red-500">*</span>
          </label>
          {loadingPenggaraps ? (
            <div className="text-xs text-[#2c5e2e]/60 italic">Memuat...</div>
          ) : penggaraps.length === 0 ? (
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
              disabled={isTracking}
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium disabled:opacity-60"
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

        {/* ERROR GPS */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5">
            <p className="text-xs text-red-700 font-semibold leading-relaxed">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* INFO GPS */}
        {infoGPS && (
          <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
            <p className="text-[11px] text-[#2c5e2e] font-semibold leading-relaxed">
              {infoGPS}
            </p>
          </div>
        )}

        {/* MAP + tombol ikuti */}
        <div className="relative bg-white border-2 border-[#2c5e2e]/10 rounded-3xl overflow-hidden shadow-sm">
          <div
            ref={containerRef}
            className="w-full h-[320px] md:h-[420px] bg-[#f5f7f3]"
            style={{ zIndex: 0 }}
          />
          <button
            onClick={centerMap}
            title="Kembali ke posisi saya"
            className="absolute bottom-3 right-3 z-[1100] w-11 h-11 rounded-full bg-white shadow-lg border-2 border-[#2c5e2e]/20 flex items-center justify-center text-xl active:scale-95 transition-transform"
          >
            🎯
          </button>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex flex-wrap gap-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={!penggarapId}
              className="flex-1 min-w-[140px] bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold text-sm px-5 py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              ▶️ Mulai Ukur
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 min-w-[140px] bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-5 py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-md animate-pulse"
            >
              ⏸️ Stop Ukur
            </button>
          )}
          <button
            onClick={undoLast}
            disabled={points.length === 0}
            className="bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] font-bold text-sm px-5 py-3.5 rounded-full border-2 border-[#f0b429]/40 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            ↩️ Hapus Titik
          </button>
          <button
            onClick={reset}
            disabled={points.length === 0}
            className="bg-white hover:bg-red-50 text-red-600 font-bold text-sm px-5 py-3.5 rounded-full border-2 border-red-200 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            🔄 Reset
          </button>
        </div>

        {/* TITIK TERAKHIR */}
        {points.length > 0 && (
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4">
            <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              Titik Terakhir
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-[#2c5e2e]">
              <div>
                <div className="text-[10px] text-[#2c5e2e]/60 mb-0.5">Lat</div>
                <div className="font-mono font-semibold truncate">
                  {points[points.length - 1].lat.toFixed(6)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#2c5e2e]/60 mb-0.5">Lng</div>
                <div className="font-mono font-semibold truncate">
                  {points[points.length - 1].lng.toFixed(6)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#2c5e2e]/60 mb-0.5">
                  Akurasi
                </div>
                <div className="font-mono font-semibold">
                  ±{points[points.length - 1].acc.toFixed(0)}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORM SIMPAN */}
        {bisaSimpan && (
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
                  {luasHa.toFixed(3)} Ha · {points.length} titik · siap disimpan
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

            {pesanErrorSimpan && (
              <div className="mt-2 bg-red-50 border-2 border-red-200 rounded-xl p-2.5">
                <p className="text-[11px] text-red-700 font-semibold break-words">
                  {pesanErrorSimpan}
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
              disabled={sedangSimpan || !namaLahan.trim()}
              className="w-full mt-3 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
            >
              {sedangSimpan ? "⏳ Menyimpan..." : "💾 Simpan ke Penggarap"}
            </button>
          </div>
        )}

        {/* BELUM BISA SIMPAN */}
        {!isTracking && points.length > 0 && points.length < 3 && (
          <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3">
            <p className="text-[11px] text-[#2c5e2e] font-semibold">
              ⏳ Minimal 3 titik untuk simpan. Sekarang {points.length} titik.
            </p>
          </div>
        )}

        {/* TIPS */}
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-3xl p-4">
          <div className="text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
            💡 Tips Ukur Akurat
          </div>
          <ul className="text-[11px] md:text-xs text-[#2c5e2e]/80 space-y-1.5 leading-relaxed">
            <li>• Keluar ruangan, langit terbuka (jangan di bawah pohon/atap)</li>
            <li>• Tunggu akurasi GPS turun (di bawah 10m lebih bagus)</li>
            <li>• Jalan pelan-pelan di batas lahan, jangan lari</li>
            <li>• Kembali ke titik awal supaya area tertutup sempurna</li>
            <li>• Titik baru dibuat tiap {JARAK_MIN_METER} meter perpindahan</li>
          </ul>
        </div>
      </div>

      {/* ============ MODE PETA ============ */}
      {mode === "peta" && (
        <PetaPilih
          penggaraps={penggaraps}
          penggarapId={penggarapId}
          setPenggarapId={setPenggarapId}
        />
      )}

      <div className="text-center pt-2">
        <Link
          href="/penggarap"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#2c5e2e]/70 hover:text-[#2c5e2e] font-bold uppercase tracking-widest transition-colors"
        >
          🌾 Lihat Semua Penggarap →
        </Link>
      </div>
    </div>
  );
}
