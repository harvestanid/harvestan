import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Save/Update kategori per komoditas
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // Array of { komoditas, cukup, baik, sangat_baik }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Format data tidak valid" },
        { status: 400 }
      );
    }

    // Validasi
    for (const item of items) {
      if (!item.komoditas) {
        return NextResponse.json(
          { error: "Komoditas wajib diisi" },
          { status: 400 }
        );
      }

      const c = item.cukup;
      const b = item.baik;
      const s = item.sangat_baik;

      // Kalau semua terisi, harus urut: cukup < baik < sangat_baik
      if (c !== null && b !== null && s !== null) {
        if (!(c < b && b < s)) {
          return NextResponse.json(
            {
              error: `Urutan salah untuk ${item.komoditas}. Harus: Cukup < Baik < Sangat Baik`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Upsert satu per satu
    const hasil: any[] = [];
    for (const item of items) {
      // Cek dulu ada atau belum
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("komoditas", item.komoditas)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("categories")
          .update({
            cukup: item.cukup,
            baik: item.baik,
            sangat_baik: item.sangat_baik,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        hasil.push(data);
      } else {
        // Insert
        const { data, error } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            komoditas: item.komoditas,
            cukup: item.cukup,
            baik: item.baik,
            sangat_baik: item.sangat_baik,
          })
          .select()
          .single();

        if (error) throw error;
        hasil.push(data);
      }
    }

    return NextResponse.json({ success: true, data: hasil });
  } catch (err: any) {
    console.error("Error save kategori:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kategori per komoditas
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const komoditas = url.searchParams.get("komoditas");

    if (!komoditas) {
      return NextResponse.json(
        { error: "komoditas wajib diisi" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", user.id)
      .eq("komoditas", komoditas);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error delete kategori:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
