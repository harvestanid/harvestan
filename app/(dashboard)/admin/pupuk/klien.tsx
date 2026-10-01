"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Pupuk = {
  id: string;
  nama: string;
  merk: string | null;
  jenis: string;
  n_persen: number;
  p_persen: number;
  k_persen: number;
  unsur_lain: string | null;
  kemasan_kg: number;
  is_active: boolean;
  urutan: number;
};

type Props = {
  pupuks: Pupuk[];
};

type FormState = {
  id?: string;
  nama: string;
  merk: string;
  jenis: string;
  n_persen: string;
  p_persen: string;
  k_persen: string;
  unsur_lain: string;
  kemasan_kg: string;
  is_active: boolean;
  urutan: string;
};

const EMPTY: FormState = {
  nama: "",
  merk: "",
  jenis: "subsidi",
  n_persen: "0",
  p_persen: "0",
  k_persen: "0",
  unsur_lain: "",
  kemasan_kg: "50",
  is_active: true,
  urutan: "0",
};

export function PupukAdminKlien({ pupuks }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  function mulaiTambah() {
    setForm(EMPTY);
    setShowForm(true);
    setPesan(null);
  }

  function mulaiEdit(p: Pupuk) {
    setForm({
      id: p.id,
      nama: p.nama,
      merk: p.merk || "",
      jenis: p.jenis,
      n_persen: String(p.n_persen),
      p_persen: String(p.p_persen),
      k_persen: String(p.k_persen),
      unsur_lain: p.unsur_lain || "",
      kemasan_kg: String(p.kemasan_kg),
      is_active: p.is_active,
      urutan: String(p.urutan),
    });
    setShowForm(true);
    setPesan(null);
  }

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPesan(null);

    if (!form.nama.trim()) {
      setPesan("❌ Nama pupuk wajib diisi");
      setLoading(false);
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      merk: form.merk.trim() || null,
      jenis: form.jenis,
      n_persen: parseFloat(form.n_persen) || 0,
      p_persen: parseFloat(form.p_persen) || 0,
      k_persen: parseFloat(form.k_persen) || 0,
      unsur_lain: form.unsur_lain.trim() || null,
      kemasan_kg: parseFloat(form.kemasan_kg) || 50,
      is_active: form.is_active,
      urutan: parseInt(form.urutan) || 0,
    };

    try {
      const res = await fetch("/api/admin/pupuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          form.id
            ? { action: "update", id: form.id, ...payload }
            : { action: "create", ...payload }
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        setPesan("❌ " + (json.error || "Gagal simpan"));
        return;
      }
      setPesan("✅ " + json.message);
      setShowForm(false);
      setForm(EMPTY);
      router.refresh();
    } catch (err: any) {
      setPesan("❌ " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(p: Pupuk) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pupuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          id: p.id,
          is_active: !p.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  async function handleHapus(p: Pupuk) {
    if (
      !confirm(
        `Hapus pupuk "${p.nama}"?\n\nPupuk yang dihapus tidak bisa dikembalikan.`
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pupuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: p.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus"));
        return;
      }
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {pesan && (
        <div
          className={`rounded-2xl p-3 text-sm font-semibold ${
            pesan.startsWith("✅")
              ? "bg-green-50 border-2 border-green-200 text-green-700"
              : "bg-red-50 border-2 border-red-200 text-red-700"
          }`}
        >
          {pesan}
        </div>
      )}

      <button
        onClick={mulaiTambah}
        className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3 rounded-full transition"
      >
        + Tambah Pupuk Baru
      </button>

      {showForm && (
        <form
          onSubmit={handleSimpan}
          className="bg-white border-2 border-[#f0b429] rounded-3xl p-5 space-y-3"
        >
          <div className="font-bold text-[#2c5e2e] mb-2">
            {form.id ? "✏️ Edit Pupuk" : "➕ Pupuk Baru"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Nama Pupuk *
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Urea / SP-36 / KCl / Phonska"
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Merk (opsional)
              </label>
              <input
                type="text"
                value={form.merk}
                onChange={(e) => setForm({ ...form, merk: e.target.value })}
                placeholder="Pupuk Indonesia / Mutiara / Petrokimia"
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Jenis
              </label>
              <select
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              >
                <option value="subsidi">Subsidi</option>
                <option value="non_subsidi">Non-Subsidi</option>
                <option value="organik">Organik</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                N (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.n_persen}
                onChange={(e) =>
                  setForm({ ...form, n_persen: e.target.value })
                }
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                P₂O₅ (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.p_persen}
                onChange={(e) =>
                  setForm({ ...form, p_persen: e.target.value })
                }
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                K₂O (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.k_persen}
                onChange={(e) =>
                  setForm({ ...form, k_persen: e.target.value })
                }
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Kemasan (kg)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={form.kemasan_kg}
                onChange={(e) =>
                  setForm({ ...form, kemasan_kg: e.target.value })
                }
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Unsur Lain (opsional)
              </label>
              <input
                type="text"
                value={form.unsur_lain}
                onChange={(e) =>
                  setForm({ ...form, unsur_lain: e.target.value })
                }
                placeholder="S 10%, MgO 20%, CaO 30%"
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                Urutan
              </label>
              <input
                type="number"
                value={form.urutan}
                onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#2c5e2e]"
                />
                <span className="text-xs font-medium text-gray-700">
                  Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-2.5 rounded-full transition disabled:opacity-50"
            >
              {loading ? "⏳ Menyimpan..." : "💾 Simpan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY);
                setPesan(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-full transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {pupuks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🧪</div>
          <p className="text-gray-500 italic text-sm">
            Belum ada pupuk. Tambah pupuk dulu.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pupuks.map((p) => (
            <div
              key={p.id}
              className={`border-2 rounded-2xl p-4 ${
                p.is_active
                  ? "bg-white border-[#2c5e2e]/15"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#2c5e2e] text-sm">
                    {p.nama}
                    {p.merk && (
                      <span className="text-gray-500 font-normal">
                        {" "}
                        — {p.merk}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {p.jenis.replace("_", "-")} · {p.kemasan_kg} kg/kemasan
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(p)}
                    disabled={loading}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${
                      p.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {p.is_active ? "✓ Aktif" : "○ Nonaktif"}
                  </button>
                  <button
                    onClick={() => mulaiEdit(p)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleHapus(p)}
                    disabled={loading}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[#2c5e2e]/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500">N</div>
                  <div className="font-bold text-[#2c5e2e]">
                    {p.n_persen}%
                  </div>
                </div>
                <div className="bg-[#2c5e2e]/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500">P₂O₅</div>
                  <div className="font-bold text-[#2c5e2e]">
                    {p.p_persen}%
                  </div>
                </div>
                <div className="bg-[#2c5e2e]/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500">K₂O</div>
                  <div className="font-bold text-[#2c5e2e]">
                    {p.k_persen}%
                  </div>
                </div>
              </div>
              {p.unsur_lain && (
                <div className="text-[10px] text-gray-500 mt-2">
                  Unsur lain: {p.unsur_lain}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
