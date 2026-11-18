"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Measurement = {
  tanggal: string;
  bobot_kg: number;
};

export function GrafikPertumbuhan({ measurements, bobotAwal }: { measurements: Measurement[], bobotAwal: number }) {
  // Siapkan data: Kalau kosong, tampilkan bobot awal aja
  const data = measurements.length > 0 ? measurements.map(m => ({
    tanggal: new Date(m.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    bobot: m.bobot_kg,
  })) : [
    { tanggal: "Awal", bobot: bobotAwal }
  ];

  // Biar garisnya gak mentok di atas/bawah
  const minBobot = Math.min(...data.map(d => d.bobot));
  const maxBobot = Math.max(...data.map(d => d.bobot));
  const padding = Math.max(10, (maxBobot - minBobot) * 0.2); // minimal padding 10kg

  return (
    <div style={{ width: "100%", height: 250, marginTop: 10 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="tanggal" 
            tick={{ fontSize: 10, fill: "#6b7280" }} 
            tickLine={false} 
            axisLine={{ stroke: "#e5e7eb" }}
            tickMargin={8}
          />
          <YAxis 
            domain={[minBobot - padding, maxBobot + padding]} 
            tick={{ fontSize: 10, fill: "#6b7280" }} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value: any) => [`${value} Kg`, "Bobot"]}
            labelStyle={{ color: "#2c5e2e", fontWeight: "bold", marginBottom: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="bobot" 
            stroke="#2c5e2e" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#f0b429", stroke: "#2c5e2e", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#2c5e2e" }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
