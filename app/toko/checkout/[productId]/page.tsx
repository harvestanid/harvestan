import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/supabase/queries/product-server";
import { CheckoutKlien } from "./klien";

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ qty?: string }>;
};

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const sp = await searchParams;
  const qty = Math.max(1, Number(sp.qty) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/toko/checkout/${productId}?qty=${qty}`);
  }

  const product = await getProductById(productId);
  if (!product) {
    redirect("/toko");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-xs text-gray-500 mb-4">
          <a href="/toko" className="hover:text-green-700">
            ← Kembali ke Toko
          </a>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          🛒 Checkout
        </h1>

        <CheckoutKlien
          product={product}
          initialQty={qty}
          userEmail={user.email || ""}
        />
      </div>
    </div>
  );
}
