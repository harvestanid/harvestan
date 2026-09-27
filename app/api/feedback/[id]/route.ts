import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, supabase, error: "Unauthorized", status: 401 };
  }

  if (user.email !== ADMIN_EMAIL) {
    return { ok: false, supabase, error: "Forbidden", status: 403 };
  }

  return { ok: true, supabase, user };
}

// ============ PATCH: mark read / pin ============
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await checkAdmin();
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );
    }

    const body = await request.json();
    const { action } = body;

    let updateData: any = {};

    if (action === "read") {
      updateData.is_read = true;
    } else if (action === "unread") {
      updateData.is_read = false;
    } else if (action === "pin") {
      // Toggle pin
      const { data: current } = await check.supabase!
        .from("feedbacks")
        .select("is_pinned")
        .eq("id", id)
        .single();
      updateData.is_pinned = !current?.is_pinned;
    } else {
      return NextResponse.json(
        { error: "Action tidak valid" },
        { status: 400 }
      );
    }

    const { error } = await check.supabase!
      .from("feedbacks")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...updateData });
  } catch (err: any) {
    console.error("PATCH feedback error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}

// ============ DELETE ============
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const check = await checkAdmin();
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );
    }

    const { error } = await check.supabase!
      .from("feedbacks")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE feedback error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
