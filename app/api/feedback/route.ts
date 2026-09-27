import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendFeedbackNotif } from "@/lib/utils/telegram";

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
    const { rating, saran_fitur, masukan } = body;

    // Validasi rating
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating harus antara 1-5" },
        { status: 400 }
      );
    }

    // Validasi: minimal ada saran_fitur atau masukan
    const saranTrim = (saran_fitur || "").trim();
    const masukanTrim = (masukan || "").trim();
    if (!saranTrim && !masukanTrim) {
      return NextResponse.json(
        { error: "Isi minimal salah satu: saran fitur atau masukan" },
        { status: 400 }
      );
    }

    // Cek spam: 1 feedback per minggu
    const satuMingguLalu = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { count: recentCount } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", satuMingguLalu);

    if (recentCount && recentCount > 0) {
      return NextResponse.json(
        {
          error:
            "Anda sudah mengirim feedback minggu ini. Tunggu 7 hari untuk kirim lagi.",
        },
        { status: 429 }
      );
    }

    // Insert feedback
    const { data: inserted, error: insertError } = await supabase
      .from("feedbacks")
      .insert({
        user_id: user.id,
        rating: ratingNum,
        saran_fitur: saranTrim || null,
        masukan: masukanTrim || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert feedback error:", insertError);
      return NextResponse.json(
        { error: "Gagal simpan feedback: " + insertError.message },
        { status: 500 }
      );
    }

    // Kirim notifikasi Telegram (async, non-blocking)
    sendFeedbackNotif({
      rating: ratingNum,
      saran_fitur: saranTrim || null,
      masukan: masukanTrim || null,
      created_at: inserted.created_at,
    }).catch((err) => {
      console.error("Telegram notif error:", err);
    });

    return NextResponse.json({
      success: true,
      feedback_id: inserted.id,
    });
  } catch (err: any) {
    console.error("API feedback error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
