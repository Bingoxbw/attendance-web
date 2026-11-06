import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyAdminPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const role = String(body.role || "admin");
  const password = String(body.password || "");

  if (role === "admin") {
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    await createSession({ role: "admin", displayName: "管理员" });
    return NextResponse.json({ ok: true, role: "admin" });
  }

  if (role === "secretary") {
    const username = String(body.username || "").trim();
    if (!username || !password) {
      return NextResponse.json(
        { error: "请输入用户名和密码" },
        { status: 400 }
      );
    }
    const account = await prisma.secretaryAccount.findUnique({
      where: { username },
    });
    if (
      !account ||
      !account.isActive ||
      !verifyPasswordHash(password, account.passwordHash)
    ) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }
    await createSession({
      role: "secretary",
      secretaryId: account.id,
      branchName: account.branchName,
      displayName: account.displayName,
    });
    return NextResponse.json({
      ok: true,
      role: "secretary",
      branchName: account.branchName,
    });
  }

  return NextResponse.json({ error: "未知角色" }, { status: 400 });
}
