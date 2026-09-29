import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "@/lib/supabase/queries/product-server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID wajib diisi" },
        { status: 400 }
      );
    }

    const result = await deleteProduct(id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}
