import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canUserInput } from "@/lib/supabase/queries/subscription-server";
import { FormPenggarapBaru } from "./form";

export const metadata = {
  title: "Tambah Penggarap",
};

export default async function PenggarapBaruPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Cek apakah user boleh input penggarap lagi
  const check = await canUserInput(user.id, "penggarap");

  // Kalau tidak boleh (limit tercapai), tampilkan upgrade prompt
  if (!check.allowed) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/penggarap"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Penggarap
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            👨‍🌾 Tambah Penggarap
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Limit Penggarap Tercapai
          </h2>
          <p className="text-sm text-orange-800 mb-2 leading-relaxed">
            {check.reason}
          </p>
          <div className="bg-white rounded-xl p-4 my-4 inline-block">
            <div className="text-xs text-gray-500 mb-1">Penggarap Anda</div>
            <div className="text-3xl font-bold text-orange-700">
              {check.currentCount} / {check.maxCount}
            </div>
          </div>
          <p className="text-xs text-orange-700 mb-6 max-w-md mx-auto">
            💎 Upgrade ke Premium untuk input unlimited penggarap, lahan,
            dan panen — hanya Rp 59.000 sekali bayar!
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
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
              🎬 Lihat Demo Dulu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Boleh input → tampilkan form
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/penggarap"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Penggarap
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          👨‍🌾 Tambah Penggarap Baru
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Isi data penggarap di bawah ini
        </p>
      </div>

      {/* Info limit untuk free tier */}
      {check.maxCount !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800">
          💡 Anda menggunakan paket <strong>Gratis</strong>:{" "}
          <strong>
            {check.currentCount} / {check.maxCount}
          </strong>{" "}
          penggarap terpakai.
        </div>
      )}

      <FormPenggarapBaru />
    </div>
  );
}
