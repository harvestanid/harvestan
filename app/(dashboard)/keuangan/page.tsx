import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KeuanganClient } from "./keuangan-client";

export default async function KeuanganPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil semua data
  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("user_id", user.id);

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", user.id);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", user.id)
    .order("tanggal", { ascending: false });

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id);

  const { data: musimCabaiList } = await supabase
    .from("musim_cabai")
    .select("id, nama")
    .eq("user_id", user.id)
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
