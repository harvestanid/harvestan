import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nama = user.user_metadata?.nama || user.email?.split("@")[0] || "Petani";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat datang, {nama}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Ini dashboard Harvestan Anda. Fitur akan segera hadir.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h2 className="font-bold text-yellow-900 mb-2">
          🚧 Sedang Dikembangkan
        </h2>
        <p className="text-yellow-800 text-sm">
          Anda berhasil login! Selanjutnya kita akan tambahkan:
        </p>
        <ul className="list-disc list-inside mt-3 text-yellow-800 text-sm space-y-1">
          <li>Manajemen Penggarap & Lahan</li>
          <li>Input Panen & Bagi Hasil</li>
          <li>Penimbangan Gabah</li>
          <li>Laporan PDF & Excel</li>
          <li>Dan masih banyak lagi...</li>
        </ul>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>Email: {user.email}</p>
        <p>User ID: {user.id}</p>
      </div>
    </div>
  );
}
