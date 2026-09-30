
"use client";

import { MapContainer, TileLayer, Polygon, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  polygon?: {
    type: "Polygon";
    coordinates: number[][][];
  } | null;
  koordinat?: string | null;
  luas?: number;
};

// Marker gaya Google Maps (pin merah klasik + shadow)
const iconPin = L.divIcon({
  className: "harvestan-pin",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
  html: `
    <div style="position: relative; width: 30px; height: 42px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
        <defs>
          <radialGradient id="pinBody" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#ff5c4d"/>
            <stop offset="55%" stop-color="#ea4335"/>
            <stop offset="100%" stop-color="#b31412"/>
          </radialGradient>
        </defs>
        <path d="M15 0 C6.72 0 0 6.72 0 15 C0 26.25 15 42 15 42 C15 42 30 26.25 30 15 C30 6.72 23.28 0 15 0 Z" fill="url(#pinBody)"/>
        <circle cx="15" cy="15" r="5.5" fill="#7a0a0a" opacity="0.5"/>
        <circle cx="15" cy="15" r="4" fill="#4a0505"/>
      </svg>
    </div>
  `,
});

function parseKoordinat(str: string | null | undefined): [number, number] | null {
  if (!str) return null;
  const parts = str.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export default function PetaMini({ polygon, koordinat, luas }: Props) {
  const ring = polygon?.coordinates?.[0] || [];
  const titikManual = parseKoordinat(koordinat);

  const punyaPolygon = ring.length >= 3;
  const punyaTitik = titikManual !== null;

  if (!punyaPolygon && !punyaTitik) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
        📍 Belum ada data lokasi (isi koordinat atau ukur via GPS)
      </div>
    );
  }

  // ===== MODE POLYGON (dari GPS walking) =====
  if (punyaPolygon) {
    const coords: [number, number][] = ring.map((c) => [c[1], c[0]]);

    const centerLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const centerLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    const lats = coords.map((c) => c[0]);
    const lngs = coords.map((c) => c[1]);
    const maxDiff = Math.max(
      Math.max(...lats) - Math.min(...lats),
      Math.max(...lngs) - Math.min(...lngs)
    );

    let zoom = 18;
    if (maxDiff > 0.0001)
      zoom = Math.min(
        18,
        Math.max(6, Math.floor(14 - Math.log2(maxDiff * 10000)))
      );

    return (
      <div className="relative z-0">
        <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={zoom}
            style={{ width: "100%", height: "100%", zIndex: 0 }}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <Polygon
              positions={coords}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.3,
                weight: 3,
              }}
            />
          </MapContainer>
        </div>
        {luas !== undefined && (
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-lg px-3 py-1.5 text-xs font-bold text-green-700 shadow-md">
            📏 {luas.toFixed(3)} Ha
          </div>
        )}
      </div>
    );
  }

  // ===== MODE TITIK MANUAL (pin) =====
  return (
    <div className="relative z-0">
      <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={titikManual!}
          zoom={17}
          style={{ width: "100%", height: "100%", zIndex: 0 }}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <Marker position={titikManual!} icon={iconPin} />
        </MapContainer>
      </div>
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-lg px-3 py-1.5 text-xs font-bold text-green-700 shadow-md">
        {luas !== undefined ? `📏 ${luas.toFixed(3)} Ha · ` : ""}
        📍 Titik lokasi
      </div>
    </div>
  );
}
