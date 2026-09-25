"use client";

import { createClient } from "@/lib/supabase/client";

export type Penggarap = {
  id: string;
  user_id: string;
  nama: string;
  alamat: string | null;
  usia: number | null;
  kontak: string | null;
  created_at: string;
  updated_at: string;
};

// ============ CLIENT-SIDE (untuk form) ============

export async function createPenggarap(input: {
  nama: string;
  alamat?: string;
  usia?: number;
  kontak?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Tidak login" };

  const { error } = await supabase.from("penggaraps").insert({
    user_id: user.id,
    nama: input.nama,
    alamat: input.alamat || null,
    usia: input.usia || null,
    kontak: input.kontak || null,
  });

  if (error) {
    console.error("Error createPenggarap:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
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
  const { error } = await supabase.from("penggaraps").delete().eq("id", id);

  if (error) {
    console.error("Error deletePenggarap:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
