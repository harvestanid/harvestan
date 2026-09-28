import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getAllPremiumRequests,
  getPremiumRequestStats,
} from "@/lib/supabase/queries/premium-server";
import { AdminPremiumKlien } from "./klien";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Admin — Premium Requests",
};

export default async function AdminPremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sm text-red-800">
            Halaman ini hanya untuk administrator.
          </p>
        </div>
      </div>
    );
  }

  const requests = await getAllPremiumRequests();
  const stats = await getPremiumRequestStats();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/feedback"
          className="text-red-700 hover:text-red-800 text-sm font-medium"
        >
          ← Feedback Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          🎁 Premium Requests Admin
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Verifikasi pengajuan premium gratis dari user
        </p>
      </div>

      <AdminPremiumKlien requests={requests} stats={stats} />
    </div>
  );
}
