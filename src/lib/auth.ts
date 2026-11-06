import { cookies } from "next/headers";
import { COOKIE_PATH } from "@/lib/paths";

export const COOKIE_NAME = "attendance_session";

export type SessionRole = "admin" | "secretary";

export type SessionPayload = {
  role: SessionRole;
  exp: number;
  secretaryId?: string;
  branchName?: string;
  displayName?: string;
};

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUtf8ToBase64Url(text: string): string {
  return toBase64Url(new TextEncoder().encode(text));
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSession(
  input: Omit<SessionPayload, "exp"> & { exp?: number }
) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  const payload: SessionPayload = {
    role: input.role,
    exp: input.exp ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
    secretaryId: input.secretaryId,
    branchName: input.branchName,
    displayName: input.displayName,
  };
  const payloadB64 = fromUtf8ToBase64Url(JSON.stringify(payload));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const token = `${payloadB64}.${toBase64Url(sig)}`;

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

async function parseToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = process.env.AUTH_SECRET || "dev-secret";
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;
    const key = await getKey(secret);
    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sig,
      new TextEncoder().encode(payloadB64)
    );
    if (!ok) return null;
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    ) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (payload.role !== "admin" && payload.role !== "secretary") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function requireSession(
  role?: SessionRole
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (role && session.role !== role) throw new Error("FORBIDDEN");
  return session;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  return password === expected;
}

/** @deprecated use verifyAdminPassword */
export function verifyPassword(password: string): boolean {
  return verifyAdminPassword(password);
}
