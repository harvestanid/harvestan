import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { PremiumKlien } from "./klien";

export const metadata = {
  title: "Upgrade Premium",
  description: "Buka semua fitur Harvestan dengan Premium",
};

export default async function PremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const status = await checkPremiumStatus(user.id);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          💎 Upgrade Premium
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Sekali bayar, akses selamanya. Tanpa langganan bulanan.
        </p>
      </div>

      <PremiumKlien status={status} />
    </div>
  );
}
