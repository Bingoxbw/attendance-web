import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.body || "").trim();
  if (!text) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }
  const reply = await prisma.qaReply.update({
    where: { id },
    data: { body: text },
  });
  return NextResponse.json({ reply });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  await prisma.qaReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
