import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { DEFAULT_BRANCH_NAME } from "@/lib/branch";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (auth.error) return auth.error;

  const rows = await prisma.member.findMany({
    distinct: ["branchName"],
    select: { branchName: true },
    orderBy: { branchName: "asc" },
  });
  const branches = Array.from(
    new Set([
      DEFAULT_BRANCH_NAME,
      ...rows.map((r) => r.branchName).filter(Boolean),
    ])
  );
  return NextResponse.json({ branches });
}
