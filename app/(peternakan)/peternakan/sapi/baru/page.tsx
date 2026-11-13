import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SapiForm } from "./form";

export const metadata = {
  title: "Tambah Sapi",
};

export default async function SapiBaruPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/peternakan/sapi" className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
          ← Kembali ke Daftar Sapi
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">🐄 Tambah Sapi Baru</h1>
      </div>
      <SapiForm />
    </div>
  );
}
