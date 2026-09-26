import { createClient } from "@/lib/supabase/server";

export type Musim = {
  id: string;
  user_id: string;
  nama: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMusimList(): Promise<Musim[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("musim_cabai")
    .select("*")
    .order("tanggal_mulai", { ascending: false });

  if (error) {
    console.error("Error getMusimList:", error);
    return [];
  }
  return (data as Musim[]) || [];
}

export async function getMusimById(id: string): Promise<Musim | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("musim_cabai")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error getMusimById:", error);
    return null;
  }
  return data as Musim;
}
