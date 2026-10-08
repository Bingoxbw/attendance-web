import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  const member = await prisma.member.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      studentId:
        body.studentId !== undefined
          ? body.studentId
            ? String(body.studentId)
            : null
          : undefined,
      yikatong:
        body.yikatong !== undefined
          ? body.yikatong
            ? String(body.yikatong)
            : null
          : undefined,
      remark: body.remark !== undefined ? body.remark : undefined,
      isActivist:
        body.isActivist !== undefined ? Boolean(body.isActivist) : undefined,
      needsFix:
        body.needsFix !== undefined ? Boolean(body.needsFix) : undefined,
      roleTag: body.roleTag !== undefined ? body.roleTag : undefined,
    },
  });

  // auto clear needsFix if keys present
  if (member.studentId || member.yikatong) {
    if (member.needsFix) {
      await prisma.member.update({
        where: { id },
        data: { needsFix: false },
      });
    }
  }

  return NextResponse.json({ member });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
