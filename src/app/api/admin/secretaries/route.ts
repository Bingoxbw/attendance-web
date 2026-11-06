import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;

  const accounts = await prisma.secretaryAccount.findMany({
    orderBy: [{ branchName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      branchName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim();
  const branchName = String(body.branchName || "").trim();

  if (!username || !password || !displayName || !branchName) {
    return NextResponse.json(
      { error: "用户名、密码、姓名、支部均不能为空" },
      { status: 400 }
    );
  }

  const existing = await prisma.secretaryAccount.findUnique({
    where: { username },
  });
  if (existing) {
    return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
  }

  const account = await prisma.secretaryAccount.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      displayName,
      branchName,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      branchName: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ account });
}
