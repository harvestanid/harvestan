import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getAllFeedback,
  getFeedbackStats,
} from "@/lib/supabase/queries/feedback-server";
import { AdminFeedbackKlien } from "./klien";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Feedback Admin",
};

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Cek admin
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

  const feedbacks = await getAllFeedback();
  const stats = await getFeedbackStats();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📊 Dashboard Feedback
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Lihat semua review & saran dari customer (anonymous)
        </p>
      </div>

      <AdminFeedbackKlien feedbacks={feedbacks} stats={stats} />
    </div>
  );
}
