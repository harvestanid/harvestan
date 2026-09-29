import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const type = requestUrl.searchParams.get("type");

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

  if (!code) {
    console.error("OAuth callback: no code found");
    return NextResponse.redirect(
      new URL("/login?error=no_code", requestUrl.origin)
    );
  }

  const redirectTarget =
    type === "recovery" ? "/reset-password/update" : next;

  let response = NextResponse.redirect(
    new URL(redirectTarget, requestUrl.origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    console.error("exchangeCodeForSession error:", exchangeError);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("OAuth callback: no user after exchange");
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/reset-password/update", requestUrl.origin)
      );
    }
    return NextResponse.redirect(
      new URL("/login?error=no_user", requestUrl.origin)
    );
  }

  const isNewUser =
    user.created_at &&
    user.last_sign_in_at &&
    Math.abs(
      new Date(user.created_at).getTime() -
        new Date(user.last_sign_in_at).getTime()
    ) < 10000;

  let finalUrl: URL;
  if (type === "recovery") {
    finalUrl = new URL("/reset-password/update", requestUrl.origin);
  } else if (isNewUser) {
    finalUrl = new URL("/dashboard?welcome=1", requestUrl.origin);
  } else {
    finalUrl = new URL(next, requestUrl.origin);
  }

  const finalResponse = NextResponse.redirect(finalUrl);
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}
