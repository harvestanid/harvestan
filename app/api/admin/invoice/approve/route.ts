import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveInvoice } from "@/lib/supabase/queries/subscription-server";
import { sendTelegram, logNotif } from "@/lib/notif/telegram";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

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

    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Hanya admin yang bisa akses" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const invoiceCode = body.invoice_code;

    if (!invoiceCode) {
      return NextResponse.json(
        { error: "invoice_code wajib diisi" },
        { status: 400 }
      );
    }

    const result = await approveInvoice(invoiceCode, user.email!);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Ambil info invoice untuk WA
    const { data: invoice } = await supabase
      .from("invoices")
      .select("user_nama, user_email, user_whatsapp, nominal")
      .eq("invoice_code", invoiceCode)
      .single();

    // Kirim notif Telegram ke admin
    const pesanTg = `✅ <b>Invoice di-approve</b>

🧾 Kode: <code>${invoiceCode}</code>
👤 Nama: ${invoice?.user_nama || "-"}
📧 Email: ${invoice?.user_email || "-"}
💰 Nominal: Rp ${(invoice?.nominal || 59000).toLocaleString("id-ID")}

Premium user sudah aktif otomatis.`;

    await sendTelegram(pesanTg);
    await logNotif({
      tipe: "telegram_admin_approve",
      target: "admin",
      pesan: `Invoice ${invoiceCode} approved`,
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
      invoice: {
        code: invoiceCode,
        nama: invoice?.user_nama,
        email: invoice?.user_email,
        whatsapp: invoice?.user_whatsapp,
      },
    });
  } catch (err: any) {
    console.error("Approve invoice exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
