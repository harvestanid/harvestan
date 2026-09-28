"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  polygon: {
    type: "Polygon";
    coordinates: number[][][];
  };
  luas?: number;
};

export default function PetaMini({ polygon, luas }: Props) {
  const ring = polygon.coordinates?.[0] || [];

  if (ring.length < 3) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
        Polygon tidak valid
      </div>
    );
  }

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

  // ✅ FIX: z-0 biar tidak nutupin banner demo
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
