import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadProductPhoto } from "@/lib/supabase/queries/product-server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Hanya admin" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const result = await uploadProductPhoto(file, user.id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, url: result.url });
  } catch (err: any) {
    console.error("Upload exception:", err);
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}
