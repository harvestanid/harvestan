"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Land = { id: string; nama: string };

type Kegiatan = {
  hst: number | "";
  judul: string;
  keterangan: string;
};

const KOMODITAS = [
  { value: "padi", label: "🌾 Padi" },
  { value: "jagung", label: "🌽 Jagung" },
  { value: "kacang_tanah", label: "🥜 Kacang Tanah" },
  { value: "bawang_merah", label: "🧅 Bawang Merah" },
  { value: "cabai_rawit", label: "🌶️ Cabai Rawit" },
  { value: "cabai", label: "🌶️ Cabai" },
];

export function KalenderForm({ lands }: { lands: Land[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [komoditas, setKomoditas] = useState("padi");
  const [landId, setLandId] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [totalHst, setTotalHst] = useState<number | "">(90);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([
    { hst: 0, judul: "Tanam", keterangan: "" },
  ]);

  function tambahKegiatan() {
    setKegiatanList([...kegiatanList, { hst: "", judul: "", keterangan: "" }]);
  }

  function hapusKegiatan(index: number) {
    if (kegiatanList.length === 1) return;
    setKegiatanList(kegiatanList.filter((_, i) => i !== index));
  }

  function updateKegiatan(index: number, field: keyof Kegiatan, value: any) {
    const newList = [...kegiatanList];
    newList[index] = { ...newList[index], [field]: value };
    setKegiatanList(newList);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tanggalMulai || !tanggalSelesai) return alert("Lengkapi tanggal tanam");
    if (totalHst === "" || totalHst < 1) return alert("Total HST panen tidak valid");
    
    // Validasi kegiatan
    for (const k of kegiatanList) {
      if (k.hst === "" || !k.judul) {
        return alert("Lengkapi HST dan judul kegiatan");
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/kalender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          komoditas,
          land_id: landId || null,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          total_hst: Number(totalHst),
          kegiatan: kegiatanList.map((k) => ({
            hst: Number(k.hst),
            judul: k.judul,
            keterangan: k.keterangan,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");

      alert("✅ Kalender berhasil dibuat");
      router.push("/kalender-tanam");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Dasar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-800">📋 Informasi Lahan & Tanam</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Komoditas</label>
            <select
              value={komoditas}
              onChange={(e) => setKomoditas(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              {KOMODITAS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Pilih Lahan (Opsional)</label>
            <select
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">- Tidak spesifik -</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>{l.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Tanggal Mulai Tanam</label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => {
                setTanggalMulai(e.target.value);
                if (!tanggalSelesai) setTanggalSelesai(e.target.value);
              }}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Tanggal Selesai Tanam</label>
            <input
              type="date"
              value={tanggalSelesai}
              min={tanggalMulai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">*HST dihitung dari tanggal mulai tanam</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Estimasi Panen (HST)</label>
            <input
              type="number"
              min="1"
              value={totalHst}
              onChange={(e) => setTotalHst(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Kegiatan Dinamis */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">🗓️ Jadwal Kegiatan</h2>
          <button
            type="button"
            onClick={tambahKegiatan}
            className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
          >
            + Tambah Kegiatan
          </button>
        </div>

        <div className="space-y-3">
          {kegiatanList.map((k, i) => (
            <div key={i} className="flex flex-wrap md:flex-nowrap gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="w-20 shrink-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">HST</label>
                <input
                  type="number"
                  value={k.hst}
                  onChange={(e) => updateKegiatan(i, "hst", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="-3 / 10"
                  required
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Kegiatan</label>
                <input
                  type="text"
                  value={k.judul}
                  onChange={(e) => updateKegiatan(i, "judul", e.target.value)}
                  placeholder="Cth: Pemupukan dasar"
                  required
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Keterangan</label>
                <input
                  type="text"
                  value={k.keterangan}
                  onChange={(e) => updateKegiatan(i, "keterangan", e.target.value)}
                  placeholder="Opsional"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => hapusKegiatan(i)}
                disabled={kegiatanList.length === 1}
                className="mt-5 p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-100 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-2.5 rounded-full transition shadow-lg disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Kalender"}
        </button>
      </div>
    </form>
  );
}
