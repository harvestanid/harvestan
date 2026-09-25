import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tanggal, jumlah, keperluan, dibayar } = body;

    if (!tanggal || !jumlah) {
      return NextResponse.json(
        { error: "tanggal dan jumlah wajib diisi" },
        { status: 400 }
      );
    }

    const jumlahNum = parseFloat(jumlah);
    const dibayarNum = parseFloat(dibayar) || 0;
    const sisaNum = Math.max(0, jumlahNum - dibayarNum);

    const { data, error } = await supabase
      .from("debts")
      .update({
        tanggal,
        jumlah: jumlahNum,
        keperluan: keperluan || null,
        dibayar: dibayarNum,
        sisa: sisaNum,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error update hutang:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("debts").delete().eq("id", id);

    if (error) {
      console.error("Error delete hutang:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
