import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/supabase/queries/product-server";
import { sendTelegram } from "@/lib/notif/telegram";

export const runtime = "nodejs";

function generateOrderCode(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
}

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

    const product = await getProductById(body.product_id);
    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const qty = Math.max(1, Number(body.qty) || 1);

    if (qty > product.stok) {
      return NextResponse.json(
        { error: `Stok tidak cukup. Tersedia ${product.stok} ${product.satuan}` },
        { status: 400 }
      );
    }

    const subtotal = product.harga * qty;
    const ongkir = Number(body.ongkir) || 0;
    const total = subtotal + ongkir;

    let code = generateOrderCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: check } = await supabase
        .from("orders")
        .select("id")
        .eq("order_code", code)
        .maybeSingle();
      if (!check) break;
      code = generateOrderCode();
      attempts++;
    }

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const userNama =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Pembeli") ||
      "Pembeli";

    const items = [
      {
        product_id: product.id,
        nama_produk: product.nama,
        harga: product.harga,
        qty,
        satuan: product.satuan,
        subtotal,
        foto_url: product.foto_urls?.[0] || null,
      },
    ];

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_code: code,
        user_id: user.id,
        user_email: user.email || "",
        user_nama: userNama,
        items,
        subtotal,
        ongkir,
        total,
        nama_penerima: body.nama_penerima,
        no_hp: body.no_hp,
        alamat: body.alamat,
        kota: body.kota,
        provinsi: body.provinsi,
        kode_pos: body.kode_pos || null,
        catatan: body.catatan || null,
        kurir: body.kurir || null,
        layanan_kurir: body.layanan_kurir || null,
        estimasi_hari: body.estimasi_hari || null,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !order) {
      console.error("Order create error:", error);
      return NextResponse.json(
        { error: error?.message || "Gagal buat order" },
        { status: 500 }
      );
    }

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      nama_produk: product.nama,
      harga: product.harga,
      qty,
      subtotal,
    });

    await sendTelegram(
      `🛒 <b>Pesanan Baru</b>\n\n` +
        `🧾 Kode: <code>${code}</code>\n` +
        `👤 Pembeli: ${userNama}\n` +
        `📦 Produk: ${product.nama}\n` +
        `🔢 Jumlah: ${qty} ${product.satuan}\n` +
        `🚚 Kurir: ${body.kurir || "-"} ${body.layanan_kurir || ""}\n` +
        `💰 Total: Rp ${total.toLocaleString("id-ID")}\n` +
        `📍 Kirim ke: ${body.kota}, ${body.provinsi}`
    );

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    console.error("Order create exception:", err);
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}
