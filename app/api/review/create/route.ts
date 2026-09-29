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
      return NextResponse.json({ error: "Login dulu" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, product_id, rating, komentar } = body;

    if (!order_id || !product_id || !rating) {
      return NextResponse.json(
        { error: "order_id, product_id, rating wajib" },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating harus 1-5" },
        { status: 400 }
      );
    }

    // Verifikasi order milik user & status selesai
    const { data: order } = await supabase
      .from("orders")
      .select("user_id, status")
      .eq("id", order_id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Bukan pesanan Anda" },
        { status: 403 }
      );
    }

    if (order.status !== "selesai") {
      return NextResponse.json(
        {
          error:
            "Pesanan belum selesai. Tunggu sampai barang diterima dulu.",
        },
        { status: 400 }
      );
    }

    // Cek belum review produk ini di order ini
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Sudah pernah review produk ini" },
        { status: 400 }
      );
    }

    const userNama =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Pembeli") ||
      "Pembeli";

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        order_id,
        product_id,
        user_id: user.id,
        user_nama: userNama,
        rating: ratingNum,
        komentar: komentar?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Review insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Tandai order_item reviewed = true
    await supabase
      .from("order_items")
      .update({ reviewed: true })
      .eq("order_id", order_id)
      .eq("product_id", product_id);

    // Update rating & total_review di produk
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product_id);

    if (allReviews && allReviews.length > 0) {
      const total = allReviews.length;
      const sum = allReviews.reduce((s, r) => s + r.rating, 0);
      const avg = sum / total;

      await supabase
        .from("products")
        .update({
          rating_rata: Number(avg.toFixed(2)),
          total_review: total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product_id);
    }

    return NextResponse.json({ ok: true, review });
  } catch (err: any) {
    console.error("Review exception:", err);
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
