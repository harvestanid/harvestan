import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Bikin musim baru
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
    const { nama, tanggal_mulai, tanggal_selesai, catatan } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama musim wajib diisi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("musim_cabai")
      .insert({
        user_id: user.id,
        nama: nama.trim(),
        tanggal_mulai: tanggal_mulai || null,
        tanggal_selesai: tanggal_selesai || null,
        catatan: catatan || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error insert musim:", error);
      // Handle duplicate
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Musim dengan nama ini sudah ada" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

// GET: Ambil semua musim user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("musim_cabai")
      .select("*")
      .eq("user_id", user.id)
      .order("tanggal_mulai", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
