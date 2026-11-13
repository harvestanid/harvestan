import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";

export const metadata = {
  title: "Manajemen Sapi",
};

export default async function SapiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: livestocks } = await supabase
    .from("livestocks")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("created_at", { ascending: false });

  const totalSapi = livestocks?.length || 0;
  const sapiAktif = livestocks?.filter((l) => l.status === "aktif").length || 0;
  const totalBobot = livestocks?.reduce((s, l) => s + Number(l.bobot_awal), 0) || 0;
  const totalInvestasi = livestocks?.reduce((s, l) => s + Number(l.harga_beli), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🐄 Manajemen Sapi</h1>
          <p className="text-gray-600 text-sm mt-1">Kelola data sapi, pakan, dan pertumbuhan.</p>
        </div>
        <Link
          href="/peternakan/sapi/baru"
          className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-5 py-2.5 rounded-full transition shadow-md"
        >
          + Tambah Sapi
        </Link>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Sapi</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalSapi}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Sapi Aktif</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{sapiAktif}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Bobot</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{totalBobot.toLocaleString("id-ID")} Kg</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Investasi</div>
          <div className="text-base font-bold text-orange-700 mt-1">Rp {totalInvestasi.toLocaleString("id-ID")}</div>
        </div>
      </div>

      {/* Daftar Sapi */}
      {!livestocks || livestocks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4 opacity-50">🐄</div>
          <h3 className="font-bold text-gray-800 mb-2 text-lg">Belum ada sapi</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Mulai catat sapi pertama Anda untuk memantau pertumbuhan dan keuntungan.</p>
          <Link href="/peternakan/sapi/baru" className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-6 py-3 rounded-full transition">
            + Tambah Sapi Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {livestocks.map((sapi) => (
            <Link
              key={sapi.id}
              href={`/peternakan/sapi/${sapi.id}`}
              className="block bg-white border-2 border-gray-100 hover:border-[#f0b429] rounded-3xl p-5 transition shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-lg text-[#2c5e2e]">{sapi.jenis}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{sapi.jenis_kelamin} · Masuk: {new Date(sapi.tanggal_masuk).toLocaleDateString("id-ID")}</div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${sapi.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {sapi.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Bobot Awal</div>
                  <div className="font-bold text-gray-800">{Number(sapi.bobot_awal).toLocaleString("id-ID")} Kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Harga Beli</div>
                  <div className="font-bold text-gray-800">Rp {Number(sapi.harga_beli).toLocaleString("id-ID")}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
