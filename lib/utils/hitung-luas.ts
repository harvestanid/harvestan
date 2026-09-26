// ===================================================
// Utility: Hitung luas polygon dari koordinat GPS
// ===================================================

export type Coordinate = { lat: number; lng: number };

/**
 * Konversi derajat ke radian
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Hitung jarak antara 2 titik GPS (meter) dengan Haversine formula
 */
export function hitungJarakMeter(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // Radius bumi (meter)
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/**
 * Hitung luas polygon (meter persegi) dengan Shoelace formula
 * + proyeksi equirectangular ke koordinat cartesian (x, y)
 */
export function hitungLuasPolygonM2(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;

  // Hitung rata-rata lat untuk konversi lng → meter
  const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const latMeter = 111320; // 1 derajat lat ≈ 111.32 km
  const lngMeter = 111320 * Math.cos(toRad(avgLat));

  // Proyeksi ke cartesian (meter)
  const origin = coords[0];
  const cartesian = coords.map((c) => ({
    x: (c.lng - origin.lng) * lngMeter,
    y: (c.lat - origin.lat) * latMeter,
  }));

  // Shoelace formula
  let area = 0;
  const n = cartesian.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += cartesian[i].x * cartesian[j].y;
    area -= cartesian[j].x * cartesian[i].y;
  }
  area = Math.abs(area) / 2;

  return area;
}

/**
 * Konversi m² ke Hektar
 */
export function m2KeHa(m2: number): number {
  return m2 / 10000;
}

/**
 * Hitung titik tengah (centroid) polygon
 */
export function hitungTitikTengah(coords: Coordinate[]): Coordinate {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat, lng };
}

/**
 * Konversi ke format GeoJSON Polygon
 */
export function keGeoJSONPolygon(coords: Coordinate[]) {
  // GeoJSON format: [lng, lat]
  const ring = coords.map((c) => [c.lng, c.lat]);
  // Tutup polygon (titik awal = titik akhir)
  if (ring.length > 0) {
    ring.push(ring[0]);
  }
  return {
    type: "Polygon" as const,
    coordinates: [ring],
  };
}

/**
 * Konversi koordinat ke string "lat,lng"
 */
export function koordinatKeString(c: Coordinate): string {
  return `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
}

/**
 * Format luas untuk display
 */
export function formatLuas(m2: number): string {
  const ha = m2KeHa(m2);
  if (ha >= 0.01) {
    return `${ha.toFixed(3)} Ha (${Math.round(m2).toLocaleString("id-ID")} m²)`;
  }
  return `${Math.round(m2).toLocaleString("id-ID")} m²`;
}
