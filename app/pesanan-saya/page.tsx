import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserOrders } from "@/lib/supabase/queries/subscription-server";
import { PesananSayaKlien } from "./klien";

export const metadata = {
  title: "Pesanan Saya",
};

export default async function PesananSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orders = await getUserOrders(user.id);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("order_id, product_id, rating, komentar, created_at")
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/toko"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Toko
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            📦 Pesanan Saya
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Riwayat pembelian & review produk
          </p>
        </div>

        <PesananSayaKlien orders={orders} reviews={reviews || []} />
      </div>
    </div>
  );
}
