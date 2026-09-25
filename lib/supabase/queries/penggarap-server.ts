import { createClient } from "@/lib/supabase/server";
import type { Penggarap } from "./penggarap";

export type Land = {
  id: string;
  user_id: string;
  penggarap_id: string;
  nama: string;
  luas: number;
  lokasi_koordinat: string | null;
  polygon: any;
  created_at: string;
  updated_at: string;
};

export async function getPenggarapList(): Promise<Penggarap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penggaraps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getPenggarapList:", error);
    return [];
  }
  return (data as Penggarap[]) || [];
}

export async function getPenggarapById(
  id: string
): Promise<Penggarap | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penggaraps")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Penggarap;
}

export async function getLandsByPenggarap(
  penggarapId: string
): Promise<Land[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lands")
    .select("*")
    .eq("penggarap_id", penggarapId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getLandsByPenggarap:", error);
    return [];
  }
  return (data as Land[]) || [];
}
