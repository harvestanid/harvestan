import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KalkulatorKlien } from "./klien";

export const metadata = {
  title: "Kalkulator Pupuk",
};

export default async function KalkulatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil SEMUA lahan user (tanpa filter is_demo, tanpa kolom komoditas)
  const { data: lands } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("user_id", user.id)
    .order("nama");

  // Ambil daftar pupuk aktif
  const { data: pupuks } = await supabase
    .from("fertilizers")
    .select("*")
    .eq("is_active", true)
    .order("urutan")
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          🧪 Kalkulator Pupuk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Hitung kebutuhan pupuk & benih sesuai luas lahan dan komoditas
        </p>
      </div>

      <KalkulatorKlien lands={lands || []} pupuks={pupuks || []} />
    </div>
  );
}
