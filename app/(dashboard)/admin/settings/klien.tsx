"use client";

import { useState } from "react";

export function SettingsKlien({ initialValue }: { initialValue: boolean }) {
  const [isOn, setIsOn] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const newValue = !isOn;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setIsOn(newValue);
      alert(newValue ? "✅ Mode Gratis Premium AKTIF. Semua user sekarang premium!" : "✅ Mode Gratis Premium DIMATIKAN. Kembali normal.");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-gray-900">Mode Gratis Premium</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Kalau di-ON, semua user bisa akses fitur premium tanpa bayar. Cocok buat promo atau event.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-16 h-8 rounded-full transition-colors flex-shrink-0 ${
            isOn ? "bg-green-500" : "bg-gray-300"
          } ${loading ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              isOn ? "translate-x-9" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <div className={`mt-4 text-sm font-bold ${isOn ? "text-green-700" : "text-gray-500"}`}>
        Status: {isOn ? "🟢 AKTIF — Semua user premium" : "⚪ NONAKTIF — Normal"}
      </div>
    </div>
  );
}
