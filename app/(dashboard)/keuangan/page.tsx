import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { KeuanganClient } from "./keuangan-client";

export default async function KeuanganPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil filter: user_id + is_demo
  const filter = await getDataFilter(user.id);

  // Ambil semua data (filtered by is_demo)
  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: musimCabaiList } = await supabase
    .from("musim_cabai")
    .select("id, nama")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal_mulai", { ascending: false });

  return (
    <KeuanganClient
      penggaraps={penggaraps || []}
      lands={lands || []}
      harvests={harvests || []}
      debts={debts || []}
      musimCabaiList={musimCabaiList || []}
    />
  );
}
