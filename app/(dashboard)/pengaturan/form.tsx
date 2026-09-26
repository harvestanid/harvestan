"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Kategori = {
  id: string;
  komoditas: string;
  cukup: number | null;
  baik: number | null;
  sangat_baik: number | null;
};

type Props = {
  komoditasList: string[];
  kategoriList: Kategori[];
  komoditasLabel: Record<string, string>;
};

export function PengaturanForm({
  komoditasList,
  kategoriList,
  komoditasLabel,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // State form: map komoditas → { cukup, baik, sangat_baik }
  const [form, setForm] = useState<Record<string, {
    cukup: string;
    baik: string;
    sangat_baik: string;
  }>>(() => {
    const init: Record<string, { cukup: string; baik: string; sangat_baik: string }> = {};
    komoditasList.forEach((kom) => {
      const existing = kategoriList.find((k) => k.komoditas === kom);
      init[kom] = {
        cukup: existing?.cukup != null ? String(existing.cukup) : "",
        baik: existing?.baik != null ? String(existing.baik) : "",
        sangat_baik:
          existing?.sangat_baik != null ? String(existing.sangat_baik) : "",
      };
    });
    return init;
  });

  function updateField(
    komoditas: string,
    field: "cukup" | "baik" | "sangat_baik",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [komoditas]: { ...prev[komoditas], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Siapkan data
    const items = komoditasList.map((kom) => {
      const f = form[kom];
      return {
        komoditas: kom,
        cukup: f.cukup === "" ? null : parseFloat(f.cukup),
        baik: f.baik === "" ? null : parseFloat(f.baik),
        sangat_baik: f.sangat_baik === "" ? null : parseFloat(f.sangat_baik),
      };
    });

    // Validasi
    for (const item of items) {
      const vals = [item.cukup, item.baik, item.sangat_baik].filter(
        (v) => v !== null
      );
      if (vals.length === 3) {
        if (!(item.cukup! < item.baik! && item.baik! < item.sangat_baik!)) {
          alert(
            `❌ Urutan salah untuk ${
              komoditasLabel[item.komoditas] || item.komoditas
            }.\nHarus: Cukup < Baik < Sangat Baik`
          );
          return;
        }
      }
    }

    setLoading(true);
    const res = await fetch("/api/kategori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("❌ Gagal simpan: " + (json.error || "Unknown error"));
      return;
    }

    setStatusMsg("✅ Tersimpan " + new Date().toLocaleTimeString("id-ID"));
    setTimeout(() => setStatusMsg(""), 3000);
    router.refresh();
  }

  async function resetDefault() {
    if (
      !confirm(
        "Reset semua kategori ke default?\n\nDefault:\n- Padi: 5000 / 6000 / 7000\n- Jagung: 4000 / 5000 / 6000"
      )
    )
      return;

    const defaults: Record<string, { cukup: number; baik: number; sangat_baik: number }> = {
      padi: { cukup: 5000, baik: 6000, sangat_baik: 7000 },
      jagung: { cukup: 4000, baik: 5000, sangat_baik: 6000 },
    };

    const newForm: Record<string, { cukup: string; baik: string; sangat_baik: string }> = {};
    komoditasList.forEach((kom) => {
      const d = defaults[kom];
      newForm[kom] = {
        cukup: d ? String(d.cukup) : "",
        baik: d ? String(d.baik) : "",
        sangat_baik: d ? String(d.sangat_baik) : "",
      };
    });
    setForm(newForm);
  }

  function getPreview(kom: string) {
    const f = form[kom];
    const c = f.cukup === "" ? null : parseFloat(f.cukup);
    const b = f.baik === "" ? null : parseFloat(f.baik);
    const s = f.sangat_baik === "" ? null : parseFloat(f.sangat_baik);

    if (c === null) {
      return (
        <div className="text-xs text-gray-500 italic">
          (belum diisi - tidak dikategorikan)
        </div>
      );
    }

    const parts: string[] = [];
    parts.push(`⚠️ <${c.toLocaleString("id-ID")} → Kurang Optimal`);
    if (b !== null) {
      parts.push(
        `⭐ ${c.toLocaleString("id-ID")}-${(b - 1).toLocaleString(
          "id-ID"
        )} → Cukup`
      );
    } else {
      parts.push(`⭐ ≥${c.toLocaleString("id-ID")} → Cukup`);
    }
    if (b !== null && s !== null) {
      parts.push(
        `⭐⭐ ${b.toLocaleString("id-ID")}-${(s - 1).toLocaleString(
          "id-ID"
        )} → Baik`
      );
      parts.push(`⭐⭐⭐ ≥${s.toLocaleString("id-ID")} → Sangat Baik`);
    } else if (b !== null) {
      parts.push(`⭐⭐ ≥${b.toLocaleString("id-ID")} → Baik`);
    }

    return (
      <div className="text-xs text-gray-600 space-y-0.5">
        {parts.map((p, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {komoditasList.map((kom) => (
        <div
          key={kom}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <div className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {komoditasLabel[kom] || kom}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">
                ⭐ Cukup ≥ (Kg/Ha)
              </label>
              <input
                type="number"
                value={form[kom].cukup}
                onChange={(e) => updateField(kom, "cukup", e.target.value)}
                placeholder="Contoh: 5000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                ⭐⭐ Baik ≥ (Kg/Ha)
              </label>
              <input
                type="number"
                value={form[kom].baik}
                onChange={(e) => updateField(kom, "baik", e.target.value)}
                placeholder="Contoh: 6000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-green-700 mb-1">
                ⭐⭐⭐ Sangat Baik ≥ (Kg/Ha)
              </label>
              <input
                type="number"
                value={form[kom].sangat_baik}
                onChange={(e) => updateField(kom, "sangat_baik", e.target.value)}
                placeholder="Contoh: 7000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
              Preview Kategori
            </div>
            {getPreview(kom)}
          </div>
        </div>
      ))}

      <div className="flex gap-3 flex-wrap items-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "⏳ Menyimpan..." : "💾 Simpan Semua"}
        </button>
        <button
          type="button"
          onClick={resetDefault}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-3 rounded-lg transition"
        >
          🔄 Reset ke Default
        </button>
        {statusMsg && (
          <span className="text-sm text-green-700 font-medium">
            {statusMsg}
          </span>
        )}
      </div>
    </form>
  );
}
