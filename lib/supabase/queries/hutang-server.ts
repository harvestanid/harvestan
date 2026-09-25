import { createClient } from "@/lib/supabase/server";

export type Hutang = {
  id: string;
  user_id: string;
  penggarap_id: string;
  tanggal: string;
  jumlah: number;
  keperluan: string | null;
  dibayar: number;
  sisa: number;
  created_at: string;
};

export async function getHutangByPenggarap(
  penggarapId: string
): Promise<Hutang[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("penggarap_id", penggarapId)
    .order("tanggal", { ascending: false });

  if (error) {
    console.error("Error getHutangByPenggarap:", error);
    return [];
  }
  return (data as Hutang[]) || [];
}

export async function getHutangById(debtId: string): Promise<Hutang | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debtId)
    .single();

  if (error) {
    console.error("Error getHutangById:", error);
    return null;
  }
  return data as Hutang;
}
