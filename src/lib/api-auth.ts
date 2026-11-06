import { NextResponse } from "next/server";
import { getSession, SessionPayload, SessionRole } from "@/lib/auth";

export async function requireApiSession(role?: SessionRole): Promise<
  | { session: SessionPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }
  if (role && session.role !== role) {
    return {
      error: NextResponse.json({ error: "无权限" }, { status: 403 }),
    };
  }
  return { session };
}
