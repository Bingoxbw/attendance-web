import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "attendance_session";
const PUBLIC = ["/login"];

type Role = "admin" | "secretary";

type SessionPayload = {
  role: Role;
  exp: number;
};

async function parseSession(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const data = new TextEncoder().encode(payloadB64);
    const ok = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!ok) return null;

    // Payload was UTF-8 encoded; atob alone would mojibake Chinese branch names.
    const bin = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const payload = JSON.parse(
      new TextDecoder().decode(bytes)
    ) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (payload.role !== "admin" && payload.role !== "secretary") return null;
    return payload;
  } catch {
    return null;
  }
}

function isAdminPath(pathname: string): boolean {
  if (pathname.startsWith("/secretary")) return false;
  if (pathname.startsWith("/api/secretary")) return false;
  // Shared QA + tutorials APIs: both roles
  if (pathname.startsWith("/api/qa")) return false;
  if (pathname.startsWith("/api/tutorials")) return false;
  if (pathname === "/qa" || pathname.startsWith("/qa/")) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isLoginApi = pathname === "/api/auth/login";
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const session = token ? await parseSession(token, secret) : null;

  if (pathname.startsWith("/api/")) {
    if (isLoginApi) return NextResponse.next();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (pathname.startsWith("/api/admin") && session.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    if (pathname.startsWith("/api/secretary") && session.role !== "secretary") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    // Block secretaries from admin-only APIs (members import, activities mutate, etc.)
    if (session.role === "secretary") {
      const allowed =
        pathname.startsWith("/api/secretary") ||
        pathname.startsWith("/api/qa") ||
        pathname.startsWith("/api/tutorials") ||
        pathname === "/api/auth/logout";
      if (!allowed) {
        return NextResponse.json({ error: "无权限" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = session.role === "secretary" ? "/secretary" : "/";
    return NextResponse.redirect(url);
  }

  if (session?.role === "secretary" && isAdminPath(pathname) && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/secretary";
    return NextResponse.redirect(url);
  }

  if (session?.role === "admin" && pathname.startsWith("/secretary")) {
    // Admin may browse secretary UI if needed; allow read of tutorials via shared routes only.
    // Keep secretary pages secretary-only.
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
