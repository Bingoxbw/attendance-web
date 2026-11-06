import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: {
    displayName?: string;
    branchName?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (body.displayName !== undefined) {
    data.displayName = String(body.displayName).trim();
  }
  if (body.branchName !== undefined) {
    data.branchName = String(body.branchName).trim();
  }
  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }
  if (body.password) {
    data.passwordHash = hashPassword(String(body.password));
  }

  const account = await prisma.secretaryAccount.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      branchName: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ account });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  await prisma.secretaryAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
