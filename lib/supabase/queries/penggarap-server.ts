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
  tipe_garap: "mandiri" | "bagi_hasil_owner" | "bagi_hasil_penggarap";
  nama_owner_external: string | null;
  persen_owner_default: number;
  persen_penggarap_default: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

// ===================================================
// GET PENGGARAP LIST (dengan filter is_demo)
// ===================================================
export async function getPenggarapList(
  isDemo: boolean = false
): Promise<Penggarap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penggaraps")
    .select("*")
    .eq("is_demo", isDemo)
    .order("is_self", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getPenggarapList:", error);
    return [];
  }
  return (data as Penggarap[]) || [];
}

// ===================================================
// GET PENGGARAP DIRI SENDIRI
// ===================================================
export async function getPenggarapDiriSendiri(
  isDemo: boolean = false
): Promise<Penggarap | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penggaraps")
    .select("*")
    .eq("is_demo", isDemo)
    .eq("is_self", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error getPenggarapDiriSendiri:", error);
    return null;
  }
  return (data as Penggarap) || null;
}

// ===================================================
// GET PENGGARAP BY ID
// ===================================================
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

// ===================================================
// GET LANDS BY PENGGARAP
// ===================================================
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
