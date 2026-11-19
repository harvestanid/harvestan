import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { ExportPremiumGate } from "./export-gate";

export const metadata = {
  title: "Export Data",
};

export default async function ExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.isPremium && premium.isActive;
  const isDemo = filter.is_demo;

  const { count: penggarapCount } = await supabase
    .from("penggaraps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: landsCount } = await supabase
    .from("lands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: harvestsCount } = await supabase
    .from("harvests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: debtsCount } = await supabase
    .from("debts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: kategoriCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { count: musimCount } = await supabase
    .from("musim_cabai")
    .select("*", { count: "exact", head: true })
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama, kontak")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Export Data</h1>
        <p className="text-gray-600 text-sm mt-1">
          Download backup (untuk import ulang) atau laporan Excel/PDF
        </p>
      </div>

      {!isPremiumActive && !isDemo && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🔒</div>
            <div className="flex-1">
              <div className="font-bold text-orange-900 mb-1">
                Export Data — Fitur Premium
              </div>
              <p className="text-xs text-orange-800 mb-3 leading-relaxed">
                Export Excel, PDF, dan Backup hanya tersedia untuk pengguna
                Premium. Coba dulu lihat demo atau upgrade untuk unlock semua
                fitur export.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/premium"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  💎 Upgrade — Rp 59.000
                </Link>
                <Link
                  href="/demo"
                  className="bg-white hover:bg-blue-50 text-blue-800 text-xs font-bold px-4 py-2 rounded-lg transition border border-blue-200"
                >
                  🎬 Lihat Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDemo && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🎬</div>
            <div className="flex-1">
              <div className="font-bold text-emerald-900 mb-1">
                Mode Demo — Semua Export Terbuka!
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Anda bisa coba semua fitur export gratis di mode demo. Semua
                file akan diberi watermark <strong>"DEMO"</strong>. Upgrade
                Premium untuk export data Anda sendiri tanpa watermark.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT BACKUP */}
      <div className="bg-white border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💾</span>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Export Backup (untuk Import Ulang)
            </h2>
            <p className="text-xs text-gray-500">
              File lengkap dengan semua data mentah — bisa di-import ke akun
              lain
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-green-700 font-medium">
              PENGGARAP
            </div>
            <div className="text-base font-bold text-green-900">
              {penggarapCount || 0}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-blue-700 font-medium">LAHAN</div>
            <div className="text-base font-bold text-blue-900">
              {landsCount || 0}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-yellow-700 font-medium">PANEN</div>
            <div className="text-base font-bold text-yellow-900">
              {harvestsCount || 0}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-red-700 font-medium">HUTANG</div>
            <div className="text-base font-bold text-red-900">
              {debtsCount || 0}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-orange-700 font-medium">
              KATEGORI
            </div>
            <div className="text-base font-bold text-orange-900">
              {kategoriCount || 0}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
            <div className="text-[9px] text-purple-700 font-medium">MUSIM</div>
            <div className="text-base font-bold text-purple-900">
              {musimCount || 0}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
          <strong>📁 Isi file Backup:</strong> 7 sheet (Penggarap, Lahan,
          Panen, Hutang, Kategori, MusimCabai, Info)
        </div>

        <ExportPremiumGate
          isPremium={isPremiumActive}
          isDemo={isDemo}
          feature="Export Backup"
        >
          <a
            href="/api/export-backup"
            download
            className="block w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-center px-6 py-3 rounded-xl transition"
          >
            💾 Download Backup (.xlsx)
          </a>
        </ExportPremiumGate>
      </div>

      {/* EXPORT LAPORAN EXCEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📥</span>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Export Laporan Excel
            </h2>
            <p className="text-xs text-gray-500">
              Enak dibaca manusia — untuk analisis & review data
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
          <strong>📁 Isi file:</strong> Sheet Penggarap, Lahan, Panen, Hutang
          dengan statistik lengkap.
        </div>

        <ExportPremiumGate
          isPremium={isPremiumActive}
          isDemo={isDemo}
          feature="Export Laporan Excel"
        >
          <a
            href="/api/export"
            download
            className="block w-full bg-green-700 hover:bg-green-800 text-white font-bold text-center px-6 py-3 rounded-xl transition"
          >
            📊 Download Laporan Excel
          </a>
        </ExportPremiumGate>
      </div>

      {/* EXPORT PDF PER PENGGARAP */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📄</span>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Export PDF per Penggarap
            </h2>
            <p className="text-xs text-gray-500">
              Laporan kinerja penggarap - siap cetak / kirim WhatsApp
            </p>
          </div>
        </div>

        {!penggaraps || penggaraps.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic text-sm">
            Belum ada penggarap. Tambahkan penggarap dulu.
          </div>
        ) : (
          <div className="space-y-2">
            {penggaraps.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <span>👨‍🌾</span>
                    <span className="truncate">{p.nama}</span>
                  </div>
                  {p.kontak && (
                    <div className="text-xs text-gray-500 ml-6">
                      {p.kontak}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/penggarap/${p.id}`}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                  >
                    Detail
                  </Link>
                  <ExportPremiumGate
                    isPremium={isPremiumActive}
                    isDemo={isDemo}
                    feature="Export PDF Penggarap"
                    inline
                  >
                    <a
                      href={`/api/export-pdf?penggarap_id=${p.id}`}
                      download
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
                    >
                      📄 PDF
                    </a>
                  </ExportPremiumGate>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        💡 Tips: PDF cocok untuk penggarap yang tidak pakai smartphone — bisa
        dicetak atau dikirim via WhatsApp
      </p>
    </div>
  );
}
