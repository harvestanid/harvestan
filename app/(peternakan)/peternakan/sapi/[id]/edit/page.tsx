import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { FormEditSapi } from "./form";

export default async function EditSapiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: sapi } = await supabase.from("livestocks").select("*").eq("id", id).eq("user_id", filter.user_id).single();
  if (!sapi) notFound();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href={`/peternakan/sapi/${id}`} className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
          ← Kembali ke Detail Sapi
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-2">✏️ Edit Sapi</h1>
      </div>
      <FormEditSapi initial={sapi} />
    </div>
  );
}
