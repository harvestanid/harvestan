"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type KategoriRow = {
  komoditas: string;
  cukup: number | null;
  baik: number | null;
  sangat_baik: number | null;
};

const KOMODITAS_OPTIONS = [
  { val: "padi", label: "🌾 Padi", default: { cukup: 5000, baik: 6000, sangat_baik: 7000 } },
  { val: "jagung", label: "🌽 Jagung", default: { cukup: 5000, baik: 6500, sangat_baik: 8000 } },
  { val: "kacang_tanah", label: "🥜 Kacang Tanah", default: null },
  { val: "bawang_merah", label: "🧅 Bawang Merah", default: null },
  { val: "cabai_rawit", label: "🌶️ Cabai Rawit", default: { cukup: 4000, baik: 6000, sangat_baik: 8000 } },
];

export function KategoriTab() {
  const supabase = createClient();

  const [rows, setRows] = useState<KategoriRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sukses, setSukses] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("categories")
        .select("komoditas, cukup, baik, sangat_baik")
        .eq("user_id", user.id)
        .eq("is_demo", false);

      const map = new Map<string, KategoriRow>();
      (data || []).forEach((d) => {
        map.set(d.komoditas, {
          komoditas: d.komoditas,
          cukup: d.cukup !== null ? Number(d.cukup) : null,
          baik: d.baik !== null ? Number(d.baik) : null,
          sangat_baik: d.sangat_baik !== null ? Number(d.sangat_baik) : null,
        });
      });

      const finalRows: KategoriRow[] = KOMODITAS_OPTIONS.map((opt) => {
        const existing = map.get(opt.val);
        if (existing) return existing;
        return {
          komoditas: opt.val,
          cukup: opt.default?.cukup ?? null,
          baik: opt.default?.baik ?? null,
          sangat_baik: opt.default?.sangat_baik ?? null,
        };
      });

      setRows(finalRows);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function updateRow(kom: string, field: keyof KategoriRow, val: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.komoditas === kom
          ? { ...r, [field]: val === "" ? null : parseFloat(val) || 0 }
          : r
      )
    );
  }

  async function handleSimpan() {
    setError("");
    setSukses("");

    // Validasi
    for (const r of rows) {
      const filled = [r.cukup, r.baik, r.sangat_baik].filter(
        (v) => v !== null
      );
      if (filled.length === 0) continue;
      if (filled.length !== 3) {
        setError(
          `Isi semua threshold ${r.komoditas} atau kosongkan semua. Tidak boleh sebagian.`
        );
        return;
      }
      if (
        r.cukup !== null &&
        r.baik !== null &&
        r.sangat_baik !== null &&
        !(r.cukup < r.baik && r.baik < r.sangat_baik)
      ) {
        setError(
          `Urutan threshold ${r.komoditas} harus: Cukup < Baik < Sangat Baik`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Login dulu");

      // Delete all + insert ulang
      await supabase
        .from("categories")
        .delete()
        .eq("user_id", user.id)
        .eq("is_demo", false);

      const payload = rows
        .filter((r) => r.cukup !== null && r.baik !== null && r.sangat_baik !== null)
        .map((r) => ({
          user_id: user.id,
          komoditas: r.komoditas,
          cukup: r.cukup,
          baik: r.baik,
          sangat_baik: r.sangat_baik,
          is_demo: false,
        }));

      if (payload.length > 0) {
        const { error: insertErr } = await supabase
          .from("categories")
          .insert(payload);

        if (insertErr) throw insertErr;
      }

      setSukses("✅ Standar KPI berhasil disimpan!");
      setTimeout(() => setSukses(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 rounded-3xl bg-[#2c5e2e]/10 flex items-center justify-center text-3xl animate-pulse">
          🏷️
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}
      {sukses && (
        <div className="p-4 bg-[#2c5e2e]/5 border-2 border-[#2c5e2e]/20 rounded-2xl text-sm text-[#2c5e2e] font-bold">
          {sukses}
        </div>
      )}

      {/* ===== INFO ===== */}
      <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/30 rounded-3xl p-5 text-sm text-[#2c5e2e] leading-relaxed">
        <div className="font-bold mb-2 uppercase tracking-widest text-xs">
          ℹ️ Apa ini?
        </div>
        <p className="text-xs">
          Isi <strong>ambang batas minimum</strong> (Kg/Ha) untuk tiap
          komoditas. Kategori produktivitas akan otomatis:{" "}
          <strong>Cukup, Baik, Sangat Baik</strong>. Kosongkan jika komoditas
          belum dikategorikan.
        </p>
      </div>

      {/* ===== TABEL KATEGORI ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
        <div className="text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-5">
          📊 Standar KPI per Komoditas
        </div>

        <div className="space-y-4">
          {rows.map((r) => {
            const opt = KOMODITAS_OPTIONS.find((o) => o.val === r.komoditas);
            const aktif = r.cukup !== null && r.baik !== null && r.sangat_baik !== null;

            return (
              <div
                key={r.komoditas}
                className={`border-2 rounded-2xl p-4 transition-all ${
                  aktif
                    ? "border-[#f0b429]/50 bg-[#f0b429]/5"
                    : "border-[#2c5e2e]/10 bg-[#faf9f5]"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="font-bold text-[#2c5e2e] text-sm tracking-tight">
                    {opt?.label || r.komoditas}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (aktif) {
                        updateRow(r.komoditas, "cukup", "");
                        updateRow(r.komoditas, "baik", "");
                        updateRow(r.komoditas, "sangat_baik", "");
                      } else if (opt?.default) {
                        updateRow(
                          r.komoditas,
                          "cukup",
                          opt.default.cukup.toString()
                        );
                        updateRow(
                          r.komoditas,
                          "baik",
                          opt.default.baik.toString()
                        );
                        updateRow(
                          r.komoditas,
                          "sangat_baik",
                          opt.default.sangat_baik.toString()
                        );
                      }
                    }}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all uppercase tracking-widest ${
                      aktif
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : opt?.default
                        ? "bg-[#2c5e2e] text-white hover:bg-[#1f4521]"
                        : "hidden"
                    }`}
                  >
                    {aktif ? "🚫 Nonaktifkan" : "✨ Pakai Default"}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-1.5">
                      ⭐ Cukup ≥
                    </label>
                    <input
                      type="number"
                      value={r.cukup ?? ""}
                      onChange={(e) =>
                        updateRow(r.komoditas, "cukup", e.target.value)
                      }
                      placeholder="—"
                      className="w-full border-2 border-[#2c5e2e]/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] bg-white text-[#2c5e2e] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-1.5">
                      ⭐⭐ Baik ≥
                    </label>
                    <input
                      type="number"
                      value={r.baik ?? ""}
                      onChange={(e) =>
                        updateRow(r.komoditas, "baik", e.target.value)
                      }
                      placeholder="—"
                      className="w-full border-2 border-[#2c5e2e]/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] bg-white text-[#2c5e2e] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-1.5">
                      ⭐⭐⭐ Sangat ≥
                    </label>
                    <input
                      type="number"
                      value={r.sangat_baik ?? ""}
                      onChange={(e) =>
                        updateRow(r.komoditas, "sangat_baik", e.target.value)
                      }
                      placeholder="—"
                      className="w-full border-2 border-[#2c5e2e]/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] bg-white text-[#2c5e2e] font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== SUBMIT ===== */}
      <button
        type="button"
        onClick={handleSimpan}
        disabled={saving}
        className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-[#2c5e2e]/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base uppercase tracking-widest"
      >
        {saving ? "⏳ Menyimpan..." : "💾 Simpan Standar KPI"}
      </button>
    </div>
  );
}
