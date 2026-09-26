"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinate } from "@/lib/utils/hitung-luas";

type Props = {
  titik: Coordinate[];
  posisiSekarang: Coordinate | null;
  isTracking: boolean;
};

// Fix Leaflet default marker icon (webpack issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icon user (biru) dan titik tracking (hijau)
const iconUser = new L.DivIcon({
  className: "custom-user-marker",
  html: `<div style="
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);
    position: relative;
  ">
    <div style="
      position: absolute;
      inset: -6px;
      border: 3px solid #3b82f6;
      border-radius: 50%;
      opacity: 0.4;
      animation: pulse 1.5s ease-in-out infinite;
    "></div>
  </div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 0; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const iconTitik = new L.DivIcon({
  className: "custom-dot-marker",
  html: `<div style="
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    width: 10px;
    height: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const iconTitikStart = new L.DivIcon({
  className: "custom-start-marker",
  html: `<div style="
    background: #f59e0b;
    border: 3px solid white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.6);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component kecil untuk auto-follow user
function AutoFollow({
  posisiSekarang,
  isTracking,
}: {
  posisiSekarang: Coordinate | null;
  isTracking: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (posisiSekarang && isTracking) {
      map.setView([posisiSekarang.lat, posisiSekarang.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [posisiSekarang, isTracking, map]);

  return null;
}

export default function PetaUkur({ titik, posisiSekarang, isTracking }: Props) {
  const [center, setCenter] = useState<[number, number] | null>(null);

  // Set center awal
  useEffect(() => {
    if (posisiSekarang) {
      setCenter([posisiSekarang.lat, posisiSekarang.lng]);
    } else if (titik.length > 0) {
      setCenter([titik[0].lat, titik[0].lng]);
    } else {
      // Default: Indonesia center (kalau belum ada GPS)
      setCenter([-6.2, 106.8]);
    }
  }, []);

  if (!center) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Memuat peta...</div>
      </div>
    );
  }

  const polylineCoords: [number, number][] = titik.map((t) => [t.lat, t.lng]);
  const polygonCoords: [number, number][] = titik.map((t) => [t.lat, t.lng]);

  return (
    <MapContainer
      center={center}
      zoom={17}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      {/* Satelit imagery dari Esri World Imagery (gratis) */}
      <TileLayer
        attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {/* Label overlay (opsional, biar keliatan nama jalan) */}
      <TileLayer
        attribution=""
        url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
        maxZoom={19}
        opacity={0.5}
      />

      {/* Posisi user sekarang */}
      {posisiSekarang && (
        <Marker
          position={[posisiSekarang.lat, posisiSekarang.lng]}
          icon={iconUser}
        />
      )}

      {/* Titik-titik tracking */}
      {titik.map((t, i) => (
        <Marker
          key={i}
          position={[t.lat, t.lng]}
          icon={i === 0 ? iconTitikStart : iconTitik}
        />
      ))}

      {/* Garis polygon (kalau >= 3 titik) */}
      {titik.length >= 3 && (
        <Polygon
          positions={polygonCoords}
          pathOptions={{
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.2,
            weight: 3,
          }}
        />
      )}

      {/* Garis polyline (kalau < 3 titik, atau sebagai border polygon) */}
      {titik.length >= 2 && (
        <Polyline
          positions={polylineCoords}
          pathOptions={{
            color: "#10b981",
            weight: 3,
            opacity: 0.9,
          }}
        />
      )}

      {/* Auto-follow user saat tracking */}
      <AutoFollow posisiSekarang={posisiSekarang} isTracking={isTracking} />
    </MapContainer>
  );
}
