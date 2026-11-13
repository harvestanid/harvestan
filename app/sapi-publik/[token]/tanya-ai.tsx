"use client";

import { useState } from "react";

export function TanyaAIKlien({ dataSapi }: { dataSapi: any }) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleTanya(e: React.FormEvent) {
    e.preventDefault();
    if (!pertanyaan.trim()) return;

    setLoading(true);
    setError("");
    setHasil(null);

    try {
      const res = await fetch("/api/sapi-public-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: dataSapi.token,
          pertanyaan: pertanyaan.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menjawab");
      setHasil(json.hasil);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-indigo-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="font-bold text-indigo-900 text-sm">Tanya AI tentang {dataSapi.nama}</h3>
          <p className="text-[10px] text-indigo-600">Tanya kondisi, harga pasar, potensi karkas, dll.</p>
        </div>
      </div>

      <form onSubmit={handleTanya} className="flex flex-col gap-2">
        <textarea
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          placeholder="Contoh: Berapa estimasi harga jual sapi ini sekarang?"
          rows={2}
          className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white resize-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "⏳ Menganalisa..." : "✨ Tanya AI"}
        </button>
      </form>

      {error && <div className="bg-red-100 text-red-700 text-xs p-2 rounded-lg">{error}</div>}

      {hasil && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {hasil}
        </div>
      )}
    </div>
  );
}
