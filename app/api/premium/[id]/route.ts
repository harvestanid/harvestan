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

// ============ PATCH: approve / reject ============
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
    const { action, rejection_reason } = body;

    // Ambil request
    const { data: req, error: fetchError } = await check.supabase!
      .from("premium_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !req) {
      return NextResponse.json(
        { error: "Request tidak ditemukan" },
        { status: 404 }
      );
    }

    if (req.status !== "pending") {
      return NextResponse.json(
        { error: "Request sudah diproses sebelumnya" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // 1. Update request → approved
      const { error: updateError } = await check.supabase!
        .from("premium_requests")
        .update({
          status: "approved",
          verified_by: check.user!.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // 2. Aktifkan premium user (barter, 1 tahun)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Cek user sudah punya subscription atau belum
      const { data: existingSub } = await check.supabase!
        .from("subscriptions")
        .select("*")
        .eq("user_id", req.user_id)
        .single();

      if (existingSub) {
        await check.supabase!
          .from("subscriptions")
          .update({
            is_premium: true,
            premium_until: expiresAt.toISOString(),
            premium_type: "barter",
            premium_source: "social_media",
            notes: `Barter ${req.tipe} - approved by admin`,
          })
          .eq("user_id", req.user_id);
      } else {
        await check.supabase!.from("subscriptions").insert({
          user_id: req.user_id,
          is_premium: true,
          premium_until: expiresAt.toISOString(),
          premium_type: "barter",
          premium_source: "social_media",
          notes: `Barter ${req.tipe} - approved by admin`,
        });
      }

      return NextResponse.json({
        success: true,
        action: "approved",
        message: "Premium aktif 1 tahun untuk user",
      });
    }

    if (action === "reject") {
      const { error: updateError } = await check.supabase!
        .from("premium_requests")
        .update({
          status: "rejected",
          verified_by: check.user!.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejection_reason || "Tidak memenuhi syarat",
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "rejected",
        message: "Request ditolak",
      });
    }

    return NextResponse.json(
      { error: "Action tidak valid. Gunakan 'approve' atau 'reject'" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Premium verify error:", err);
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
      .from("premium_requests")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete premium request error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
