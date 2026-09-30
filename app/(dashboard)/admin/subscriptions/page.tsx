import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllSubscriptions } from "@/lib/supabase/queries/subscription-server";
import { SubscriptionKlien } from "./klien";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export const metadata = {
  title: "Manajemen Premium",
};

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const subscriptions = await getAllSubscriptions();

  const stats = {
    total: subscriptions.length,
    premium: subscriptions.filter((s) => s.is_premium).length,
    free: subscriptions.filter((s) => !s.is_premium).length,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          💎 Manajemen Premium
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Kelola status premium semua user — aktifkan / cabut
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest">
            Total User
          </div>
          <div className="text-2xl font-bold text-[#2c5e2e] mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white border-2 border-[#f0b429]/40 rounded-2xl p-4">
          <div className="text-2xl mb-1">💎</div>
          <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest">
            Premium
          </div>
          <div className="text-2xl font-bold text-[#2c5e2e] mt-1">
            {stats.premium}
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">🆓</div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Free
          </div>
          <div className="text-2xl font-bold text-gray-700 mt-1">
            {stats.free}
          </div>
        </div>
      </div>

      <SubscriptionKlien subscriptions={subscriptions} />
    </div>
  );
}
