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
      return NextResponse.json(
        { error: "Anda harus login dulu" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada log yang dipilih" },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Maksimal 100 log per sekali hapus" },
        { status: 400 }
      );
    }

    // ===== 1. Ambil foto_url dari semua log yang mau dihapus =====
    const { data: logs, error: fetchError } = await supabase
      .from("activity_logs")
      .select("id, foto_url")
      .in("id", ids)
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Fetch logs error:", fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: "Log tidak ditemukan atau bukan milik Anda" },
        { status: 404 }
      );
    }

    // ===== 2. Hapus semua foto dari storage =====
    const fotoPaths: string[] = [];
    for (const log of logs) {
      if (log.foto_url) {
        try {
          const url = new URL(log.foto_url);
          const pathParts = url.pathname.split("/activity-photos/");
          if (pathParts[1]) {
            fotoPaths.push(decodeURIComponent(pathParts[1]));
          }
        } catch (e) {
          console.error("Parse foto_url error:", e);
        }
      }
    }

    let fotoTerhapus = 0;
    if (fotoPaths.length > 0) {
      const { data: removeData, error: removeError } = await supabase.storage
        .from("activity-photos")
        .remove(fotoPaths);

      if (removeError) {
        console.error("Hapus foto error:", removeError);
        // Lanjut aja walau foto gagal — jangan blokir hapus row
      } else {
        fotoTerhapus = removeData?.length || 0;
      }
    }

    // ===== 3. Hapus rows dari database =====
    const { error: deleteError } = await supabase
      .from("activity_logs")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Delete rows error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      jumlah_dihapus: logs.length,
      jumlah_foto_dihapus: fotoTerhapus,
    });
  } catch (err: any) {
    console.error("Delete bulk error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
