import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/supabase/queries/product-server";
import { FormProduk } from "../../baru/klien";

export const metadata = {
  title: "Edit Produk",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProdukPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/katalog"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Katalog
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          ✏️ Edit Produk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Ubah data produk: {product.nama}
        </p>
      </div>

      <FormProduk productId={product.id} initialData={product} />
    </div>
  );
}
