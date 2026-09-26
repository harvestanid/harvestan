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

    // ========== STEP 1: Ambil data panen dulu ==========
    const { data: panen, error: fetchError } = await supabase
      .from("harvests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !panen) {
      return NextResponse.json(
        { error: "Data panen tidak ditemukan" },
        { status: 404 }
      );
    }

    const potonganHutang = Number(panen.potongan_hutang || 0);
    const penggarapId = panen.land_id
      ? await getPenggarapIdFromLand(supabase, panen.land_id)
      : null;

    // ========== STEP 2: Kalau ada potongan hutang, REVERT dulu ==========
    if (potonganHutang > 0 && penggarapId) {
      // Ambil hutang penggarap urut TERBARU dulu
      // (karena waktu potong urutan TERLAMA dulu → revert TERBARU dulu)
      const { data: hutangList } = await supabase
        .from("debts")
        .select("*")
        .eq("penggarap_id", penggarapId)
        .eq("user_id", user.id)
        .order("tanggal", { ascending: false });

      let sisaRevert = potonganHutang;
      const waktuRevert = new Date().toISOString();

      for (const h of hutangList || []) {
        if (sisaRevert <= 0) break;

        const dibayarLama = Number(h.dibayar || 0);
        const sisaLama = Number(h.sisa || 0);
        const revertAmount = Math.min(dibayarLama, sisaRevert);

        if (revertAmount <= 0) continue;

        const logEntry = {
          aksi: "revert_hapus_panen",
          waktu: waktuRevert,
          jumlah: revertAmount,
          sisa_sebelum: sisaLama,
          sisa_sesudah: sisaLama + revertAmount,
          keterangan: `Revert karena hapus panen tanggal ${panen.tanggal}`,
        };

        const logLama = Array.isArray(h.log_perubahan) ? h.log_perubahan : [];
        const logBaru = [...logLama, logEntry];

        await supabase
          .from("debts")
          .update({
            dibayar: dibayarLama - revertAmount,
            sisa: sisaLama + revertAmount,
            log_perubahan: logBaru,
          })
          .eq("id", h.id);

        sisaRevert -= revertAmount;
      }
    }

    // ========== STEP 3: Hapus data panen ==========
    const { error } = await supabase.from("harvests").delete().eq("id", id);

    if (error) {
      console.error("Error delete panen:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reverted: potonganHutang,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

// Helper: ambil penggarap_id dari land_id
async function getPenggarapIdFromLand(
  supabase: any,
  landId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("lands")
    .select("penggarap_id")
    .eq("id", landId)
    .single();
  return data?.penggarap_id || null;
}
