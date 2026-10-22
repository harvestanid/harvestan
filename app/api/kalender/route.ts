import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDataFilter } from "@/lib/demo/demo-mode";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filter = await getDataFilter(user.id);
    const body = await request.json();
    const {
      komoditas,
      land_id,
      tanggal_mulai,
      tanggal_selesai,
      total_hst,
      kegiatan,
    } = body;

    if (!komoditas || !tanggal_mulai || !tanggal_selesai || !total_hst) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Simpan Header (Kalender Tanam)
    const { data: kalender, error: errKalender } = await supabase
      .from("kalender_tanam")
      .insert({
        user_id: filter.user_id,
        land_id: land_id || null,
        komoditas,
        tanggal_mulai,
        tanggal_selesai,
        total_hst,
        is_demo: filter.is_demo,
      })
      .select()
      .single();

    if (errKalender) throw errKalender;

    // 2. Simpan Detail (Kegiatan)
    if (kegiatan && Array.isArray(kegiatan) && kegiatan.length > 0) {
      const kegiatanData = kegiatan.map((k: any) => ({
        kalender_id: kalender.id,
        hst: k.hst,
        judul: k.judul,
        keterangan: k.keterangan || null,
      }));

      const { error: errKegiatan } = await supabase
        .from("kalender_kegiatan")
        .insert(kegiatanData);

      if (errKegiatan) {
        // Rollback header kalau detail gagal
        await supabase.from("kalender_tanam").delete().eq("id", kalender.id);
        throw errKegiatan;
      }
    }

    return NextResponse.json({ success: true, id: kalender.id });
  } catch (err: any) {
    console.error("POST /api/kalender error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
