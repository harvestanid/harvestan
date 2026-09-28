import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { LaporanClient } from "./klien";

export default async function LaporanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil filter: user_id + is_demo
  const filter = await getDataFilter(user.id);

  // Ambil tahun dari harvests (filtered)
  const { data: harvests } = await supabase
    .from("harvests")
    .select("tanggal")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const tahunSet = new Set<number>();
  (harvests || []).forEach((h) => {
    tahunSet.add(new Date(h.tanggal).getFullYear());
  });
  const tahunTersedia = Array.from(tahunSet).sort((a, b) => b - a);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📄 Laporan & Evaluasi
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Generate laporan tahunan/5 tahunan untuk evaluasi & pendampingan
          penggarap
        </p>
      </div>

      <LaporanClient tahunTersedia={tahunTersedia} />
    </div>
  );
}
