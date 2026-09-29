import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

export async function POST() {
  const supabase = await createClient();

  // Sign out dari Supabase (hapus session di server)
  await supabase.auth.signOut();

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  const response = NextResponse.redirect(`${protocol}://${host}/login`, {
    status: 303,
  });

  // ===== PAKSA HAPUS SEMUA COOKIE SUPABASE =====
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((cookie) => {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("supabase") ||
      cookie.name.includes("auth-token")
    ) {
      // Hapus dengan berbagai opsi biar bener-bener ke-clear
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
        expires: new Date(0),
      });
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
        domain: host,
        expires: new Date(0),
      });
    }
  });

  // Hapus juga cookie secara umum (safety)
  ["sb-access-token", "sb-refresh-token"].forEach((name) => {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
    });
  });

  return response;
}

export async function GET() {
  return POST();
}
