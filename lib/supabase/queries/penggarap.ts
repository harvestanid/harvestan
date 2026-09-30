"use client";

import { createClient } from "@/lib/supabase/client";

export type Penggarap = {
  id: string;
  user_id: string;
  nama: string;
  alamat: string | null;
  usia: number | null;
  kontak: string | null;
  is_self: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

// ============ CLIENT-SIDE (untuk form) ============

export async function createPenggarap(input: {
  nama: string;
  alamat?: string;
  usia?: number;
  kontak?: string;
  is_self?: boolean;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Tidak login" };

  const { data, error } = await supabase
    .from("penggaraps")
    .insert({
      user_id: user.id,
      nama: input.nama,
      alamat: input.alamat || null,
      usia: input.usia || null,
      kontak: input.kontak || null,
      is_self: input.is_self || false,
      is_demo: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error createPenggarap:", error);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

export async function updatePenggarap(
  id: string,
  input: {
    nama: string;
    alamat?: string;
    usia?: number;
    kontak?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("penggaraps")
    .update({
      nama: input.nama,
      alamat: input.alamat || null,
      usia: input.usia || null,
      kontak: input.kontak || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updatePenggarap:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deletePenggarap(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Cek dulu apakah penggarap ini "diri sendiri"
  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("is_self")
    .eq("id", id)
    .single();

  if (penggarap?.is_self) {
    return {
      success: false,
      error:
        "Penggarap 'Diri Sendiri' tidak bisa dihapus. Kalau mau hapus, ubah dulu tipe-nya di pengaturan.",
    };
  }

  const { error } = await supabase.from("penggaraps").delete().eq("id", id);

  if (error) {
    console.error("Error deletePenggarap:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ============ CARI DIRI SENDIRI ============
export async function getDiriSendiri(): Promise<Penggarap | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("penggaraps")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_self", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error getDiriSendiri:", error);
    return null;
  }
  return data as Penggarap | null;
}
