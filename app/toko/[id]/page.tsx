import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getProductById,
  getKategoriLabel,
  getKategoriIcon,
} from "@/lib/supabase/queries/product-server";
import { DetailKlien } from "./klien";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produk Tidak Ditemukan" };
  return {
    title: `${product.nama} - Toko Harvestan`,
    description: product.deskripsi?.slice(0, 160) || product.nama,
  };
}

export default async function DetailProdukPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*")
    .eq("kategori", product.kategori)
    .eq("status", "aktif")
    .neq("id", id)
    .limit(4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-horizontal.png"
              alt="Harvestan"
              className="h-12 md:h-16 w-auto"
            />
          </Link>
          <Link
            href="/toko"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Kembali ke Toko
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link href="/toko" className="hover:text-green-700">
            Toko
          </Link>
          {" › "}
          <span>
            {getKategoriIcon(product.kategori)}{" "}
            {getKategoriLabel(product.kategori)}
          </span>
          {" › "}
          <span className="text-gray-900 font-medium">{product.nama}</span>
        </div>

        {/* Detail */}
        <DetailKlien
          product={product}
          reviews={reviews || []}
          relatedProducts={relatedProducts || []}
        />
      </div>
    </div>
  );
}
