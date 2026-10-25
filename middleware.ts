import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  if (error || !user) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/auth/sign-in";
    destination.search = "";
    destination.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(destination);
  }
  if (isAdminPath && user.app_metadata?.role !== "admin") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/app";
    destination.search = "";
    return NextResponse.redirect(destination);
  }
  return response;
}

export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
