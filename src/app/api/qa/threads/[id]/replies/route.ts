import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;
  const { id: threadId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim();
  if (!text) {
    return NextResponse.json({ error: "回复不能为空" }, { status: 400 });
  }

  const thread = await prisma.qaThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: "问题不存在" }, { status: 404 });
  }

  const authorName =
    auth.session.role === "admin"
      ? "管理员"
      : auth.session.displayName || "支书";

  const reply = await prisma.qaReply.create({
    data: {
      threadId,
      body: text,
      authorRole: auth.session.role,
      authorName,
      authorSecretaryId: auth.session.secretaryId || null,
    },
  });

  return NextResponse.json({ reply });
}
