import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const thread = await prisma.qaThread.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!thread) {
    return NextResponse.json({ error: "不存在" }, { status: 404 });
  }
  return NextResponse.json({ thread });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; body?: string } = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.body !== undefined) data.body = String(body.body).trim();
  const thread = await prisma.qaThread.update({ where: { id }, data });
  return NextResponse.json({ thread });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  await prisma.qaThread.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
