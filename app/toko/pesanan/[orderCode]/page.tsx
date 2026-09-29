import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { InvoicePesanan } from "./klien";

type Props = {
  params: Promise<{ orderCode: string }>;
};

export const metadata = {
  title: "Detail Pesanan",
};

export default async function PesananPage({ params }: Props) {
  const { orderCode } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/toko"
          className="text-xs text-gray-500 hover:text-green-700"
        >
          ← Kembali ke Toko
        </Link>

        <InvoicePesanan order={order} />
      </div>
    </div>
  );
}
