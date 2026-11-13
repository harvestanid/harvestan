import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FormBiaya } from "./form";
import { getDataFilter } from "@/lib/demo/demo-mode";

export const metadata = { title: "Tambah Biaya Operasional" };

export default async function BiayaBaruPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);
  const { data: jenisCustom } = await supabase
    .from("livestock_custom_jenis")
    .select("*")
    .eq("user_id", filter.user_id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/peternakan/sapi/biaya" className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
          ← Kembali ke Biaya Operasional
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">📝 Tambah Biaya</h1>
        <p className="text-gray-600 text-sm mt-1">Catat pengeluaran operasional kandang.</p>
      </div>
      <FormBiaya jenisCustom={jenisCustom || []} />
    </div>
  );
}
