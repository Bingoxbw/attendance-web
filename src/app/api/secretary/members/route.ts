import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireApiSession("secretary");
  if (auth.error) return auth.error;
  const branchName = auth.session.branchName!;

  const members = await prisma.member.findMany({
    where: { branchName },
    orderBy: [{ isActivist: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ branchName, members });
}
