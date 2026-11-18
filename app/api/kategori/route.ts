import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDataFilter } from "@/lib/demo/demo-mode";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = await getDataFilter(user.id);

    const { data, error } = await supabase
      .from("categories")
      .select("komoditas, cukup, baik, sangat_baik")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    if (error) throw error;

    return NextResponse.json({
      is_demo: filter.is_demo,
      data: data || [],
    });
  } catch (err: any) {
    console.error("GET kategori error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Format data tidak valid" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = await getDataFilter(user.id);

    // Siapin payload cuma buat yang diisi lengkap
    const payload = rows
      .filter(
        (r: any) =>
          r.cukup !== null && r.baik !== null && r.sangat_baik !== null
      )
      .map((r: any) => ({
        user_id: filter.user_id,
        komoditas: r.komoditas,
        cukup: r.cukup,
        baik: r.baik,
        sangat_baik: r.sangat_baik,
        is_demo: filter.is_demo,
      }));

    // UPSERT (Update or Insert) berdasarkan user_id + komoditas
    if (payload.length > 0) {
      const { error: upsertErr } = await supabase
        .from("categories")
        .upsert(payload, {
          onConflict: "user_id,komoditas",
        });

      if (upsertErr) throw upsertErr;
    }

    // (Optional) Handle yang di-nonaktifkan (dikosongkan).
    // Karena kodenya ngehapus data kalau dikosongin, kita perlu hapus baris
    // yang di DB gak ada di payload (khusus user & is_demo ini).
    const komoditasTerisi = payload.map((p: any) => p.komoditas);
    const semuaKomoditas = rows.map((r: any) => r.komoditas);

    // Yang ada di form tapi gak masuk payload = dikosongin user, jadi hapus dari DB
    const yangHarusDihapus = semuaKomoditas.filter(
      (k: string) => !komoditasTerisi.includes(k)
    );

    if (yangHarusDihapus.length > 0) {
      await supabase
        .from("categories")
        .delete()
        .eq("user_id", filter.user_id)
        .eq("is_demo", filter.is_demo)
        .in("komoditas", yangHarusDihapus);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST kategori error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
