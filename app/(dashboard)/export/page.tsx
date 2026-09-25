import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil hitungan untuk preview
  const { count: penggarapCount } = await supabase
    .from("penggaraps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: landsCount } = await supabase
    .from("lands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: harvestsCount } = await supabase
    .from("harvests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: debtsCount } = await supabase
    .from("debts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 Export Data</h1>
        <p className="text-gray-600 text-sm mt-1">
          Download semua data Anda dalam 1 file Excel
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📋 Data yang Akan Diexport
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">👨‍🌾</div>
            <div className="text-xs text-green-700 font-medium">PENGGARAP</div>
            <div className="text-xl font-bold text-green-900 mt-1">
              {penggarapCount || 0}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🗺️</div>
            <div className="text-xs text-blue-700 font-medium">LAHAN</div>
            <div className="text-xl font-bold text-blue-900 mt-1">
              {landsCount || 0}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🌾</div>
            <div className="text-xs text-yellow-700 font-medium">PANEN</div>
            <div className="text-xl font-bold text-yellow-900 mt-1">
              {harvestsCount || 0}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs text-red-700 font-medium">HUTANG</div>
            <div className="text-xl font-bold text-red-900 mt-1">
              {debtsCount || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📁 File Excel Berisi 4 Sheet
        </h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">1️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Sheet Penggarap</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Data lengkap penggarap + total lahan, panen, profit, hutang
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">2️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Sheet Lahan</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Semua lahan + koordinat GPS + statistik panen
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">3️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Sheet Panen</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Riwayat lengkap panen + perhitungan profit & potongan hutang
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">4️⃣</span>
            <div>
              <div className="font-medium text-gray-900">Sheet Hutang</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Semua hutang + status (aktif/lunas)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-yellow-900">
          <strong>💡 Tips:</strong> File Excel bisa dibuka di Google Sheets,
          Microsoft Excel, WPS Office, atau Numbers (Mac). Simpan sebagai
          backup bulanan!
        </p>
      </div>

      <a
        href="/api/export"
        download
        className="block w-full bg-green-700 hover:bg-green-800 text-white font-bold text-center px-6 py-4 rounded-xl transition text-lg"
      >
        📥 Download Excel Sekarang
      </a>

      <p className="text-xs text-gray-500 text-center mt-3">
        File akan terdownload otomatis dengan nama{" "}
        <strong>Harvestan_Export_YYYY-MM-DD.xlsx</strong>
      </p>
    </div>
  );
}
