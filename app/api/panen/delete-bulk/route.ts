import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const harvestIds: string[] = body.harvest_ids;

    if (!Array.isArray(harvestIds) || harvestIds.length === 0) {
      return NextResponse.json(
        { error: "harvest_ids wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil semua harvest yang mau dihapus (verifikasi milik user)
    const { data: harvests, error: errFetch } = await supabase
      .from("harvests")
      .select("*")
      .in("id", harvestIds)
      .eq("user_id", user.id);

    if (errFetch) {
      console.error("Fetch harvests error:", errFetch);
      return NextResponse.json(
        { error: "Gagal ambil data panen" },
        { status: 500 }
      );
    }

    if (!harvests || harvests.length === 0) {
      return NextResponse.json(
        { error: "Panen tidak ditemukan" },
        { status: 404 }
      );
    }

    let totalRevert = 0;
    let totalDipotongBalik = 0;

    // ===== REVERT POTONGAN HUTANG =====
    for (const h of harvests) {
      const potonganLog = Array.isArray(h.potongan_hutang_log)
        ? h.potongan_hutang_log
        : [];

      if (potonganLog.length === 0) continue;

      for (const log of potonganLog) {
        const debtId = log.debt_id;
        const jumlah = Number(log.jumlah_dipotong || 0);

        if (!debtId || jumlah <= 0) continue;

        // Ambil hutang terkait
        const { data: debt } = await supabase
          .from("debts")
          .select("*")
          .eq("id", debtId)
          .eq("user_id", user.id)
          .single();

        if (!debt) continue;

        const sisaLama = Number(debt.sisa || 0);
        const dibayarLama = Number(debt.dibayar || 0);

        const sisaBaru = sisaLama + jumlah;
        const dibayarBaru = Math.max(0, dibayarLama - jumlah);

        // Bersihkan log_perubahan: hapus entry dengan aksi "potong_panen" yang cocok
        const logLama = Array.isArray(debt.log_perubahan)
          ? debt.log_perubahan
          : [];
        const logBaru = logLama.filter(
          (l: any) =>
            !(
              l.aksi === "potong_panen" &&
              Number(l.jumlah) === jumlah
            )
        );

        await supabase
          .from("debts")
          .update({
            sisa: sisaBaru,
            dibayar: dibayarBaru,
            log_perubahan: logBaru,
          })
          .eq("id", debtId);

        totalRevert += jumlah;
      }

      totalDipotongBalik += 1;
    }

    // ===== HAPUS HARVESTS =====
    const { error: errDelete } = await supabase
      .from("harvests")
      .delete()
      .in("id", harvestIds)
      .eq("user_id", user.id);

    if (errDelete) {
      console.error("Delete harvests error:", errDelete);
      return NextResponse.json(
        { error: "Gagal hapus panen: " + errDelete.message },
        { status: 500 }
      );
    }

    const pesan =
      `${harvests.length} panen berhasil dihapus` +
      (totalRevert > 0
        ? ` · Hutang dikembalikan: Rp ${totalRevert.toLocaleString("id-ID")}`
        : "");

    return NextResponse.json({
      ok: true,
      message: pesan,
      deleted: harvests.length,
      hutang_revert: totalRevert,
    });
  } catch (err: any) {
    console.error("Delete-bulk exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
