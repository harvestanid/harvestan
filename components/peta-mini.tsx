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

// Fix icon Leaflet default (sering ilang di Next.js)
const iconPin = L.icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNCA1IDEwYzAgOCA5IDE2IDEwIDI1IDAgMCAxMCAwIDEwLTE3IDUgMCAxMC01IDUtMTAgMC02LTUtMTAtMTAtMTB6IiBmaWxsPSIjMTBiOTgxIi8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxMCIgcj0iNCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
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

  // Placeholder kalau GAK ADA data sama sekali
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

  // ===== MODE TITIK MANUAL (pin saja) =====
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
