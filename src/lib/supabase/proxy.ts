import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isPublicAuthPath } from "@/lib/auth/paths";

import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
} from "./config";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicPath = isPublicAuthPath(pathname);

  if (!isSupabaseConfigured()) {
    if (isPublicPath) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/accedi";
    url.searchParams.set("error", "auth_not_configured");
    return NextResponse.redirect(url);
  }

  const { publishableKey, url } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/accedi";
    url.searchParams.set(
      "returnTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && pathname === "/accedi") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}
