import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const type = requestUrl.searchParams.get("type"); // 'recovery' untuk reset password

  // ===== CEK ERROR DARI GOOGLE/SUPABASE =====
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          errorDescription || errorParam
        )}`,
        requestUrl.origin
      )
    );
  }

  // ===== CEK CODE =====
  if (!code) {
    console.error("OAuth callback: no code found");
    return NextResponse.redirect(
      new URL("/login?error=no_code", requestUrl.origin)
    );
  }

  // ===== TENTUKAN REDIRECT URL =====
  // Kalau tipe recovery → redirect ke reset-password/update
  // Kalau bukan → redirect ke dashboard (atau next)
  const redirectTarget =
    type === "recovery" ? "/reset-password/update" : next;

  // ===== BUAT RESPONSE DULU (sebelum set cookie) =====
  let response = NextResponse.redirect(
    new URL(redirectTarget, requestUrl.origin)
  );

  // ===== CREATE SUPABASE CLIENT DENGAN COOKIE HANDLER =====
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookie di REQUEST (biar middleware baca)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Set cookie di RESPONSE (biar browser simpan)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ===== EXCHANGE CODE JADI SESSION =====
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    console.error("exchangeCodeForSession error:", exchangeError);
    // Kalau recovery link expired / error, arahkan ke halaman update (yang akan cek session)
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/reset-password/update", requestUrl.origin)
      );
    }
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(exchangeError.message)}`,
        requestUrl.origin
      )
    );
  }

  // ===== VERIFIKASI USER BERHASIL LOGIN =====
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("OAuth callback: no user after exchange");
    // Kalau recovery, tetap ke halaman update (biar user lihat pesan error jelas)
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/reset-password/update", requestUrl.origin)
      );
    }
    return NextResponse.redirect(
      new URL("/login?error=no_user", requestUrl.origin)
    );
  }

  // ===== CEK USER BARU =====
  const isNewUser =
    user.created_at &&
    user.last_sign_in_at &&
    Math.abs(
      new Date(user.created_at).getTime() -
        new Date(user.last_sign_in_at).getTime()
    ) < 10000;

  // ===== REDIRECT FINAL =====
  let finalUrl: URL;
  if (type === "recovery") {
    finalUrl = new URL("/reset-password/update", requestUrl.origin);
  } else if (isNewUser) {
    finalUrl = new URL("/dashboard?welcome=1", requestUrl.origin);
  } else {
    finalUrl = new URL(next, requestUrl.origin);
  }

  // Buat response baru + copy cookies dari response sebelumnya
  const finalResponse = NextResponse.redirect(finalUrl);
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}
