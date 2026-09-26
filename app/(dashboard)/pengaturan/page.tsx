import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PengaturanForm } from "./form";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil kategori existing
  const { data: kategoriList } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  // Ambil komoditas yang ada di panen (untuk menampilkan di list)
  const { data: harvests } = await supabase
    .from("harvests")
    .select("komoditas")
    .eq("user_id", user.id);

  // Kumpulkan komoditas unik dari panen
  const komoditasSet = new Set<string>();
  (harvests || []).forEach((h) => {
    komoditasSet.add(h.komoditas || "padi");
  });

  // Tambahkan komoditas yang sudah punya kategori
  (kategoriList || []).forEach((k) => {
    komoditasSet.add(k.komoditas);
  });

  // Kalau kosong, tampilkan default 5 komoditas
  if (komoditasSet.size === 0) {
    ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"].forEach(
      (k) => komoditasSet.add(k)
    );
  }

  const komoditasList = Array.from(komoditasSet).sort((a, b) => {
    const order = ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"];
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ⚙️ Pengaturan Kategori
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Atur threshold produktivitas (Kg/Ha) untuk setiap komoditas
        </p>
      </div>

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

      <PengaturanForm
        komoditasList={komoditasList}
        kategoriList={kategoriList || []}
        komoditasLabel={KOMODITAS_LABEL}
      />
    </div>
  );
}
