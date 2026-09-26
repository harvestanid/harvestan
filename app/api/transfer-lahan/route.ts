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
    const { from_penggarap_id, to_penggarap_id, land_ids, transfer_hutang } =
      body;

    // ========== VALIDASI ==========
    if (!from_penggarap_id || !to_penggarap_id) {
      return NextResponse.json(
        { error: "Penggarap asal dan tujuan wajib diisi" },
        { status: 400 }
      );
    }

    if (from_penggarap_id === to_penggarap_id) {
      return NextResponse.json(
        { error: "Tidak bisa transfer ke penggarap yang sama" },
        { status: 400 }
      );
    }

    if (!Array.isArray(land_ids) || land_ids.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 lahan untuk dipindah" },
        { status: 400 }
      );
    }

    // ========== CEK KEPEMILIKAN ==========
    const { data: fromPenggarap } = await supabase
      .from("penggaraps")
      .select("id, nama")
      .eq("id", from_penggarap_id)
      .eq("user_id", user.id)
      .single();

    const { data: toPenggarap } = await supabase
      .from("penggaraps")
      .select("id, nama")
      .eq("id", to_penggarap_id)
      .eq("user_id", user.id)
      .single();

    if (!fromPenggarap || !toPenggarap) {
      return NextResponse.json(
        { error: "Penggarap tidak ditemukan" },
        { status: 404 }
      );
    }

    // ========== TRANSFER LAHAN ==========
    // Update penggarap_id di tabel lands
    const { data: updatedLands, error: updateError } = await supabase
      .from("lands")
      .update({ penggarap_id: to_penggarap_id })
      .in("id", land_ids)
      .eq("user_id", user.id)
      .select();

    if (updateError) {
      console.error("Error transfer lahan:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // ========== TRANSFER HUTANG (opsional) ==========
    let transferredHutang = 0;
    if (transfer_hutang) {
      const { data: updatedDebts, error: hutangError } = await supabase
        .from("debts")
        .update({ penggarap_id: to_penggarap_id })
        .eq("penggarap_id", from_penggarap_id)
        .eq("user_id", user.id)
        .gt("sisa", 0)
        .select();

      if (hutangError) {
        console.error("Error transfer hutang:", hutangError);
      } else {
        transferredHutang = updatedDebts?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      transferred_lands: updatedLands?.length || 0,
      transferred_hutang: transferredHutang,
      from: fromPenggarap.nama,
      to: toPenggarap.nama,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
