import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GrafikClient } from "./grafik-client";

export default async function GrafikPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil semua data
  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("user_id", user.id)
    .order("nama");

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", user.id);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("id, land_id, tanggal, komoditas, hasil_kg, musim")
    .eq("user_id", user.id)
    .order("tanggal", { ascending: true });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Grafik & Analisis</h1>
        <p className="text-gray-600 text-sm mt-1">
          Visualisasi produksi & produktivitas per komoditas dan penggarap
        </p>
      </div>

      <GrafikClient
        penggaraps={penggaraps || []}
        lands={lands || []}
        harvests={harvests || []}
      />
    </div>
  );
}
