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

    // Cek apakah sudah ada request pending
    const { count: pendingCount } = await supabase
      .from("premium_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (pendingCount && pendingCount > 0) {
      return NextResponse.json(
        {
          error:
            "Anda masih punya request yang menunggu verifikasi. Tunggu hasil verifikasi dulu.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tipe, platform, link_post, screenshot_url, catatan_user } = body;

    if (!tipe) {
      return NextResponse.json(
        { error: "Tipe request wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi: untuk social_media, wajib ada link_post ATAU screenshot_url
    if (tipe === "social_media" && !link_post && !screenshot_url) {
      return NextResponse.json(
        {
          error:
            "Wajib isi minimal salah satu: link postingan atau screenshot",
        },
        { status: 400 }
      );
    }

    // Insert
    const { data: inserted, error: insertError } = await supabase
      .from("premium_requests")
      .insert({
        user_id: user.id,
        tipe,
        platform: platform || null,
        link_post: link_post || null,
        screenshot_url: screenshot_url || null,
        catatan_user: catatan_user || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert premium_request error:", insertError);
      return NextResponse.json(
        { error: "Gagal submit: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request_id: inserted.id,
      message: "Request berhasil dikirim. Tunggu verifikasi 1x24 jam.",
    });
  } catch (err: any) {
    console.error("Premium request error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
