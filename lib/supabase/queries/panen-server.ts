import { createClient } from "@/lib/supabase/server";

export type Panen = {
  id: string;
  user_id: string;
  land_id: string;
  tanggal: string;
  komoditas: string;
  musim: string | null;
  hasil_kg: number;
  harga_gabah: number;
  biaya_panen_per_kg: number;
  biaya_tambahan: number;
  keterangan_biaya: string | null;
  bawa_penggarap: number;
  bawa_owner: number;
  bawa_lain: number;
  persen_owner: number;
  persen_penggarap: number;
  profit_bersih: number;
  profit_owner: number;
  profit_penggarap: number;
  potongan_hutang: number;
  total_hutang_sebelum: number;
  sisa_hutang_sesudah: number;
  catatan: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPanenByLahan(landId: string): Promise<Panen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("harvests")
    .select("*")
    .eq("land_id", landId)
    .order("tanggal", { ascending: false });

  if (error) {
    console.error("Error getPanenByLahan:", error);
    return [];
  }
  return (data as Panen[]) || [];
}

export async function getPanenById(harvestId: string): Promise<Panen | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("harvests")
    .select("*")
    .eq("id", harvestId)
    .single();

  if (error) {
    console.error("Error getPanenById:", error);
    return null;
  }
  return data as Panen;
}
