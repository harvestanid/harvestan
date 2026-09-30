import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canUserInput } from "@/lib/supabase/queries/subscription-server";
import { getPenggarapDiriSendiri } from "@/lib/supabase/queries/penggarap-server";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { FormPenggarapBaru } from "./form";

export const metadata = {
  title: "Tambah Penggarap",
};

export default async function PenggarapBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ is_self?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const isSelf = params.is_self === "true";

  const filter = await getDataFilter(user.id);

  // Kalau mode "diri sendiri" & user sudah punya → redirect ke penggarap itu
  if (isSelf) {
    const existing = await getPenggarapDiriSendiri(filter.is_demo);
    if (existing) {
      redirect(`/penggarap/${existing.id}`);
    }
  }

  // Cek limit penggarap (khusus mode non-self, biar gak makan kuota)
  const check = await canUserInput(user.id, "penggarap");

  if (!check.allowed && !isSelf) {
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
          <p className="text-xs text-orange-700 mb-4 max-w-md mx-auto">
            💡 Kalau mau catat <strong>diri sendiri</strong> sebagai penggarap,
            itu <strong>tidak kena limit</strong> — tinggal klik tombol
            "+ Diri Sendiri" di halaman penggarap.
          </p>
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

  // Pre-fill dari metadata user
  const meta = user.user_metadata || {};
  const namaUser =
    meta.username || meta.nama || meta.full_name || user.email?.split("@")[0] || "";
  const kontakUser = meta.kontak || meta.phone || "";

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
          {isSelf ? "🌱 Tambah Diri Sendiri" : "👨‍🌾 Tambah Penggarap"}
        </h1>
        {isSelf && (
          <p className="text-gray-600 text-sm mt-1">
            Catat diri sendiri sebagai penggarap — bisa garap lahan sendiri
            atau lahan orang
          </p>
        )}
      </div>

      {!isSelf && check.maxCount !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800">
          💡 Anda menggunakan paket <strong>Gratis</strong>:{" "}
          <strong>
            {check.currentCount} / {check.maxCount}
          </strong>{" "}
          penggarap terpakai. <strong>Diri sendiri tidak kena limit.</strong>
        </div>
      )}

      <FormPenggarapBaru
        isSelf={isSelf}
        namaPrefill={isSelf ? namaUser : ""}
        kontakPrefill={isSelf ? kontakUser : ""}
      />
    </div>
  );
}
