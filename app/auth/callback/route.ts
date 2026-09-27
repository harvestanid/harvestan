import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

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

  // ===== BUAT RESPONSE DULU (sebelum set cookie) =====
  // Ini kunci fix: cookie harus di-set di RESPONSE yang akan dikirim ke browser
  let response = NextResponse.redirect(
    new URL(next, requestUrl.origin)
  );

  // ===== CREATE SUPABASE CLIENT DENGAN COOKIE HANDLER =====
  // Cookie di-set ke `response`, bukan ke `cookieStore`
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
  const finalUrl = isNewUser
    ? new URL("/dashboard?welcome=1", requestUrl.origin)
    : new URL(next, requestUrl.origin);

  // Buat response baru untuk redirect final + copy cookies dari response sebelumnya
  const finalResponse = NextResponse.redirect(finalUrl);
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}
