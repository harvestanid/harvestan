import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/supabase/queries/product-server";
import { sendTelegram } from "@/lib/notif/telegram";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login dulu" }, { status: 401 });
    }

    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Hanya admin" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.nama || !body.kategori || body.harga === undefined) {
      return NextResponse.json(
        { error: "Nama, kategori, harga wajib" },
        { status: 400 }
      );
    }

    const result = await createProduct({
      nama: body.nama,
      kategori: body.kategori,
      sub_kategori: body.sub_kategori || null,
      harga: Number(body.harga),
      satuan: body.satuan || "pcs",
      stok: Number(body.stok) || 0,
      berat_gram: Number(body.berat_gram) || 1000,
      deskripsi: body.deskripsi || null,
      foto_urls: body.foto_urls || [],
      status: body.status || "aktif",
      unggulan: body.unggulan || false,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Notif Telegram
    await sendTelegram(
      `📦 <b>Produk Baru Ditambahkan</b>\n\n` +
        `📝 Nama: ${body.nama}\n` +
        `🏷️ Kategori: ${body.kategori}\n` +
        `💰 Harga: Rp ${Number(body.harga).toLocaleString("id-ID")}\n` +
        `📊 Stok: ${body.stok || 0} ${body.satuan || "pcs"}`
    );

    return NextResponse.json({ ok: true, product: result.product });
  } catch (err: any) {
    console.error("Create product exception:", err);
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}
