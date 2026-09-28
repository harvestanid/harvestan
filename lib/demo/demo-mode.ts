import { createClient } from "@/lib/supabase/server";

// ===================================================
// TIPE
// ===================================================
export type DemoSession = {
  id: string;
  user_id: string;
  is_active: boolean;
  started_at: string;
  expires_at: string;
  last_restart_at: string | null;
  total_restarts: number;
};

export type DemoStatus = {
  isActive: boolean;
  session: DemoSession | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  canStart: boolean;
  canRestart: boolean;
  message?: string;
};

// ===================================================
// CEK STATUS DEMO USER
// ===================================================
export async function getDemoStatus(userId: string): Promise<DemoStatus> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("demo_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Tidak ada session → user bisa mulai demo
  if (error || !session) {
    return {
      isActive: false,
      session: null,
      expiresAt: null,
      daysRemaining: null,
      canStart: true,
      canRestart: false,
    };
  }

  // Ada session tapi tidak aktif → user bisa mulai lagi
  if (!session.is_active) {
    return {
      isActive: false,
      session,
      expiresAt: null,
      daysRemaining: null,
      canStart: true,
      canRestart: false,
    };
  }

  // Cek expiry
  const now = Date.now();
  const expiresAt = new Date(session.expires_at).getTime();
  const isExpired = expiresAt <= now;

  if (isExpired) {
    // Expired → auto-deactivate
    await supabase
      .from("demo_sessions")
      .update({ is_active: false })
      .eq("user_id", userId);

    return {
      isActive: false,
      session,
      expiresAt: session.expires_at,
      daysRemaining: 0,
      canStart: true,
      canRestart: false,
      message: "Demo Anda sudah kadaluarsa",
    };
  }

  // Aktif & belum expired
  const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  // Cek jeda restart (minimal 24 jam sejak restart terakhir)
  let canRestart = false;
  if (session.last_restart_at) {
    const lastRestart = new Date(session.last_restart_at).getTime();
    const hoursSinceRestart = (now - lastRestart) / (1000 * 60 * 60);
    canRestart = hoursSinceRestart >= 24;
  } else {
    canRestart = true;
  }

  return {
    isActive: true,
    session,
    expiresAt: session.expires_at,
    daysRemaining,
    canStart: false,
    canRestart,
  };
}

// ===================================================
// CEK APAKAH USER SEDANG MODE DEMO
// ===================================================
export async function isDemoActive(userId: string): Promise<boolean> {
  const status = await getDemoStatus(userId);
  return status.isActive;
}

// ===================================================
// DATA FILTER — dipakai di semua query
// Return object untuk .eq() atau .match()
// ===================================================
export type DataFilter = {
  user_id: string;
  is_demo: boolean;
};

export async function getDataFilter(userId: string): Promise<DataFilter> {
  const demoActive = await isDemoActive(userId);
  return {
    user_id: userId,
    is_demo: demoActive, // Kalau demo aktif → true (ambil data demo saja)
  };
}

// ===================================================
// CEK BOLEH INPUT (tidak boleh input saat demo)
// ===================================================
export async function canInputDuringMode(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const demoActive = await isDemoActive(userId);

  if (demoActive) {
    return {
      allowed: false,
      reason:
        "Anda sedang dalam MODE DEMO. Tidak bisa input data baru. Klik 'Selesai Demo' dulu untuk kembali ke data Anda.",
    };
  }

  return { allowed: true };
}
