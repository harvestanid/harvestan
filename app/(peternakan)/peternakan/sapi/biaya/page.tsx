import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { BiayaKlien } from "./klien";

export const metadata = { title: "Biaya Operasional Sapi" };

export default async function BiayaSapiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: logs } = await supabase
    .from("farm_operational_logs")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const { data: jenisCustom } = await supabase
    .from("livestock_custom_jenis")
    .select("*")
    .eq("user_id", filter.user_id)
    .order("created_at", { ascending: true });

  return <BiayaKlien logs={logs || []} jenisCustom={jenisCustom || []} isDemo={filter.is_demo} />;
}
