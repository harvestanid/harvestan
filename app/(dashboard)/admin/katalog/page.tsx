import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProductsList } from "@/lib/supabase/queries/product-server";
import { KatalogKlien } from "./klien";

export const metadata = {
  title: "Katalog Admin",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export default async function AdminKatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const products = await getProductsList();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3 mt-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📦 Katalog Produk
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Kelola produk Harvestan — {products.length} produk
            </p>
          </div>
          <Link
            href="/admin/katalog/baru"
            className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition"
          >
            + Tambah Produk
          </Link>
        </div>
      </div>

      <KatalogKlien products={products} />
    </div>
  );
}
