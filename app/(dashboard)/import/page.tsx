import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { ImportKlien } from "./klien";

export const metadata = {
  title: "Import Data",
};

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.isPremium && premium.isActive;

  // Kalau bukan premium → halaman locked
  if (!isPremiumActive) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            📥 Import Data
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Import Data — Premium
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            Restore / pindah data dari file backup hanya tersedia untuk
            pengguna Premium. Fitur ini sangat berguna kalau pindah device
            atau akun.
          </p>

          <div className="bg-white rounded-xl p-4 my-4 text-left max-w-md mx-auto border border-green-200">
            <div className="text-xs font-bold text-green-800 mb-2">
              ✨ Fitur Import Data:
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ Restore semua data dari file backup</li>
              <li>✅ Pindah akun tanpa input ulang</li>
              <li>✅ 2 mode: Timpa / Tambah</li>
              <li>✅ Auto-remap ID (anti bentrok)</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              href="/premium"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              💎 Upgrade — Rp 59.000
            </Link>
            <Link
              href="/demo"
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium px-6 py-3 rounded-xl transition border border-blue-200"
            >
              🎬 Lihat Demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📥 Import Data</h1>
        <p className="text-gray-600 text-sm mt-1">
          Upload file backup untuk mengembalikan / pindah data
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Cara pakai:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-0.5">
              <li>
                Dari akun lama, buka{" "}
                <Link href="/export" className="underline font-bold">
                  Export
                </Link>{" "}
                → klik <strong>Download Backup</strong>
              </li>
              <li>Login akun baru (yang mau diisi data)</li>
              <li>
                Buka <strong>Import</strong> ini, upload file backup tadi
              </li>
              <li>Pilih mode: Timpa atau Tambah</li>
              <li>Klik Import, tunggu selesai</li>
            </ol>
          </div>
        </div>
      </div>

      <ImportKlien />
    </div>
  );
}
