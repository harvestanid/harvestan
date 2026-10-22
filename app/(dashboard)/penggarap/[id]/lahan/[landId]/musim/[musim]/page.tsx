import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";

type Props = {
  params: Promise<{ id: string; landId: string; musim: string }>;
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function DetailMusimPage({ params }: Props) {
  const { id, landId, musim: musimEncoded } = await params;
  const musim = decodeURIComponent(musimEncoded);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: lahan } = await supabase
    .from("lands")
    .select("*")
    .eq("id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!lahan) redirect(`/penggarap/${id}`);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!penggarap) redirect("/penggarap");

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("land_id", landId)
    .eq("musim", musim)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const totalHasil = (harvests || []).reduce(
    (s, h) => s + Number(h.hasil_kg),
    0
  );
  const totalProfitOwner = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {lahan.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🌶️ Musim: {musim}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap.nama} &middot; {lahan.nama}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center min-w-0">
          <div className="text-[10px] text-gray-500 uppercase">Total Panen</div>
          <div className="text-lg font-bold text-gray-900">
            {(harvests || []).length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center min-w-0">
          <div className="text-[10px] text-gray-500 uppercase">Total Hasil</div>
          <div className="text-lg font-bold text-green-700">
            {totalHasil.toLocaleString("id-ID")} Kg
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center min-w-0">
          <div className="text-[10px] text-gray-500 uppercase">
            Profit Owner
          </div>
          <div className="text-sm font-bold text-green-700 mt-1 angka-fit">
            {formatRp(totalProfitOwner)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center min-w-0">
          <div className="text-[10px] text-gray-500 uppercase">
            Profit Penggarap
          </div>
          <div className="text-sm font-bold text-orange-700 mt-1 angka-fit">
            {formatRp(totalProfitPenggarap)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-4">
          📜 Daftar Panen ({musim})
        </h2>
        {(!harvests || harvests.length === 0) ? (
          <div className="text-center py-8 text-gray-400 italic text-sm">
            Belum ada data panen di musim ini.
          </div>
        ) : (
          <div className="space-y-3">
            {harvests.map((h) => {
              const prod = Number(h.hasil_kg) / Number(lahan.luas);
              return (
                <Link
                  key={h.id}
                  href={`/penggarap/${id}/lahan/${landId}/panen/${h.id}`}
                  className="block bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-xl p-4 transition"
                >
                  <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
                    <span className="font-bold text-gray-800 text-sm">
                      {KOMODITAS_LABEL[h.komoditas] || h.komoditas}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(h.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-gray-500 text-[10px]">Hasil</div>
                      <div className="font-bold text-gray-800">
                        {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[10px]">Produktivitas</div>
                      <div className="font-bold text-green-700">
                        {prod.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-gray-500 text-[10px]">Profit Bersih</div>
                      <div className="font-bold text-blue-700 angka-fit">
                        {formatRp(Number(h.profit_bersih || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
                    <div className="text-[10px] font-bold text-blue-800 uppercase mb-2">
                      Bagi Hasil
                    </div>
                    <div className="text-xs text-blue-900 mb-3 flex justify-between items-center gap-2 flex-wrap">
                      <span>Profit Bersih:</span>
                      <span className="font-bold angka-fit">
                        {formatRp(Number(h.profit_bersih || 0))}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-2 border border-blue-200 text-center min-w-0">
                        <div className="text-[10px] text-blue-800 font-bold mb-1">👤 Owner</div>
                        <div className="font-bold text-green-700 text-sm angka-fit whitespace-nowrap">
                          {formatRp(Number(h.profit_owner || 0))}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-2 border border-blue-200 text-center min-w-0">
                        <div className="text-[10px] text-blue-800 font-bold mb-1">👨‍🌾 Penggarap</div>
                        <div className="font-bold text-orange-600 text-sm angka-fit whitespace-nowrap">
                          {formatRp(Number(h.profit_penggarap || 0))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-xl text-center">
                      🔍 Detail
                    </div>
                    <div className="flex-1 bg-[#f0b429]/20 text-[#2c5e2e] text-xs font-bold py-2 rounded-xl text-center">
                      ✏️ Edit
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
