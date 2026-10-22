import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";

export const metadata = {
  title: "Kalender Tanam",
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

export default async function KalenderTanamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: kalenderList } = await supabase
    .from("kalender_tanam")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Kalender Tanam</h1>
          <p className="text-gray-600 text-sm mt-1">
            Atur jadwal kegiatan dari tanam hingga panen
          </p>
        </div>
        <Link
          href="/kalender-tanam/baru"
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-5 py-2.5 rounded-full transition shadow-lg"
        >
          + Buat Kalender
        </Link>
      </div>

      {!kalenderList || kalenderList.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4 opacity-50">📅</div>
          <h3 className="font-bold text-gray-800 mb-2 text-lg">Belum ada kalender</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Buat jadwal tanam pertamamu. Tentukan tanggal tanam dan kegiatan apa saja yang akan dilakukan.
          </p>
          <Link href="/kalender-tanam/baru" className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-full transition">
            + Buat Kalender Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kalenderList.map((k) => (
            <Link
              key={k.id}
              href={`/kalender-tanam/${k.id}`}
              className="block bg-white border-2 border-gray-100 hover:border-green-300 rounded-3xl p-5 transition shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{KOMODITAS_LABEL[k.komoditas] || k.komoditas}</span>
                <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full">
                  {k.total_hst} HST
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                📅 {new Date(k.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                {k.tanggal_mulai !== k.tanggal_selesai && (
                  <> - {new Date(k.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Dibuat: {new Date(k.created_at).toLocaleDateString("id-ID")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
