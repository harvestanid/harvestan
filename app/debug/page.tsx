"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [result, setResult] = useState<string>("Loading...");

  useEffect(() => {
    async function test() {
      // Test dengan polygon contoh (Sawah Utama)
      const polygon = {
        type: "Polygon" as const,
        coordinates: [
          [
            [112.174348, -6.994303],
            [112.174500, -6.994303],
            [112.174500, -6.994100],
            [112.174348, -6.994100],
            [112.174348, -6.994303],
          ],
        ],
      };

      const ring = polygon.coordinates[0];
      const lats = ring.map((c) => c[1]);
      const lngs = ring.map((c) => c[0]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      const spanLatM = (maxLat - minLat) * 111320;
      const spanLngM =
        (maxLng - minLng) *
        111320 *
        Math.cos((centerLat * Math.PI) / 180);
      const maxSpanM = Math.max(spanLatM, spanLngM);
      const paddedSpanM = maxSpanM * 1.2;

      const CANVAS_SIZE = 1024;
      const latRad = (centerLat * Math.PI) / 180;
      const numerator = CANVAS_SIZE * 156543.03 * Math.cos(latRad);
      const zExact = Math.log2(numerator / paddedSpanM);
      const zoom = Math.max(14, Math.min(19, Math.floor(zExact)));

      setResult(
        JSON.stringify(
          {
            minLat,
            maxLat,
            minLng,
            maxLng,
            centerLat,
            centerLng,
            spanLatM: spanLatM.toFixed(1),
            spanLngM: spanLngM.toFixed(1),
            maxSpanM: maxSpanM.toFixed(1),
            paddedSpanM: paddedSpanM.toFixed(1),
            zExact: zExact.toFixed(2),
            zoom,
          },
          null,
          2
        )
      );
    }
    test();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Polygon Bounds</h1>
      <pre className="bg-gray-100 p-4 rounded text-xs">{result}</pre>
    </div>
  );
}
