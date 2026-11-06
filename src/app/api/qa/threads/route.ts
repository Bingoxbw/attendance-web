import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;

  const threads = await prisma.qaThread.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();
  if (!title || !text) {
    return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
  }

  const authorName =
    auth.session.role === "admin"
      ? "管理员"
      : auth.session.displayName || "支书";

  const thread = await prisma.qaThread.create({
    data: {
      title,
      body: text,
      authorRole: auth.session.role,
      authorName,
      authorSecretaryId: auth.session.secretaryId || null,
    },
  });

  return NextResponse.json({ thread });
}
