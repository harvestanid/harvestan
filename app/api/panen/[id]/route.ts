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
    const {
      tanggal,
      komoditas,
      musim,
      hasil_kg,
      harga_gabah,
      biaya_panen_per_kg,
      biaya_tambahan,
      keterangan_biaya,
      bawa_penggarap,
      bawa_owner,
      bawa_lain,
      persen_owner,
      catatan,
    } = body;

    if (!tanggal || !hasil_kg || !harga_gabah) {
      return NextResponse.json(
        { error: "tanggal, hasil_kg, harga_gabah wajib diisi" },
        { status: 400 }
      );
    }

    const hasilKg = parseFloat(hasil_kg);
    const hargaGabah = parseFloat(harga_gabah);
    const biayaPanen = parseFloat(biaya_panen_per_kg) || 0;
    const biayaTambahan = parseFloat(biaya_tambahan) || 0;
    const persenOwnerNum = parseFloat(persen_owner) || 50;
    const persenPenggarapNum = 100 - persenOwnerNum;

    const pendapatan = hasilKg * hargaGabah;
    const totalBiaya = hasilKg * biayaPanen + biayaTambahan;
    const profitBersih = pendapatan - totalBiaya;

    let profitOwner = 0;
    let profitPenggarap = 0;

    if (profitBersih > 0) {
      profitOwner = profitBersih * (persenOwnerNum / 100);
      profitPenggarap = profitBersih * (persenPenggarapNum / 100);
    }

    const { data, error } = await supabase
      .from("harvests")
      .update({
        tanggal,
        komoditas: komoditas || "padi",
        musim: musim || null,
        hasil_kg: hasilKg,
        harga_gabah: hargaGabah,
        harga_per_kg: hargaGabah,
        biaya_panen_per_kg: biayaPanen,
        biaya_tambahan: biayaTambahan,
        keterangan_biaya: keterangan_biaya || null,
        bawa_penggarap: parseFloat(bawa_penggarap) || 0,
        bawa_owner: parseFloat(bawa_owner) || 0,
        bawa_lain: parseFloat(bawa_lain) || 0,
        persen_owner: persenOwnerNum,
        persen_penggarap: persenPenggarapNum,
        profit_bersih: profitBersih,
        profit_owner: profitOwner,
        profit_penggarap: profitPenggarap,
        catatan: catatan || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error update panen:", error);
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

    const { error } = await supabase.from("harvests").delete().eq("id", id);

    if (error) {
      console.error("Error delete panen:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
