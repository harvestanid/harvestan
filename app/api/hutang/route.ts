import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { penggarap_id, tanggal, jumlah, keperluan } = body;

    if (!penggarap_id || !tanggal || !jumlah) {
      return NextResponse.json(
        { error: "penggarap_id, tanggal, jumlah wajib diisi" },
        { status: 400 }
      );
    }

    const jumlahNum = parseFloat(jumlah);
    if (isNaN(jumlahNum) || jumlahNum <= 0) {
      return NextResponse.json(
        { error: "jumlah harus angka positif" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
        penggarap_id,
        tanggal,
        jumlah: jumlahNum,
        keperluan: keperluan || null,
        dibayar: 0,
        sisa: jumlahNum,
      })
      .select()
      .single();

    if (error) {
      console.error("Error insert hutang:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
