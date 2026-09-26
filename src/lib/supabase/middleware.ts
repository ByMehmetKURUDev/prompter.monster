import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { localePath, stripLocale } from "@/lib/i18n";

/** Refreshes the Supabase session cookie on every request and protects /library. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not run code between createServerClient and getUser — it can log users out unexpectedly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullPath = request.nextUrl.pathname;
  const { locale, path } = stripLocale(fullPath);
  if (!user && (path.startsWith("/library") || path.startsWith("/account") || path.startsWith("/admin"))) {
    const login = request.nextUrl.clone();
    login.pathname = path.startsWith("/admin") ? "/login" : localePath("/login", locale);
    login.search = "";
    login.searchParams.set("next", fullPath);
    return NextResponse.redirect(login);
  }
  if (user && path === "/login") {
    const raw = request.nextUrl.searchParams.get("next") || localePath("/studio", locale);
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/studio";
    const to = new URL(next, request.nextUrl.origin);
    return NextResponse.redirect(to);
  }

  return response;
}
