"use client";

import { PengaturanForm } from "./form";

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

export function KategoriTab({
  komoditasList,
  kategoriList,
  komoditasLabel,
}: Props) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>ℹ️ Cara kerja:</strong> Threshold ini digunakan untuk
        mengkategorikan produktivitas penggarap secara otomatis di laporan.
        <ul className="list-disc list-inside mt-2 space-y-0.5">
          <li>
            <strong>⚠️ Kurang Optimal</strong> → di bawah nilai Cukup
          </li>
          <li>
            <strong>⭐ Cukup</strong> → ≥ nilai Cukup
          </li>
          <li>
            <strong>⭐⭐ Baik</strong> → ≥ nilai Baik
          </li>
          <li>
            <strong>⭐⭐⭐ Sangat Baik</strong> → ≥ nilai Sangat Baik
          </li>
        </ul>
        <p className="mt-2 text-xs italic">
          Kosongkan nilai kalau komoditas belum ingin dikategorikan.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6 text-xs text-yellow-800">
        📌 Menampilkan <strong>{komoditasList.length} komoditas</strong>. Semua
        komoditas bawaan sistem (padi, jagung, kacang tanah, bawang merah,
        cabai rawit) + komoditas dari data panen Anda.
      </div>

      <PengaturanForm
        komoditasList={komoditasList}
        kategoriList={kategoriList}
        komoditasLabel={komoditasLabel}
      />
    </div>
  );
}
