import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calcBranchRate,
  filterCountableMembers,
} from "@/lib/stats/attendance-rate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const includeActivists =
    req.nextUrl.searchParams.get("includeActivists") === "1";

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      records: {
        include: { member: true },
        orderBy: { signedAt: "asc" },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  const members = await prisma.member.findMany({
    orderBy: [{ isActivist: "asc" }, { name: "asc" }],
  });

  const presentIds = new Set(
    activity.records.filter((r) => r.memberId).map((r) => r.memberId as string)
  );

  const countable = filterCountableMembers(members, includeActivists);
  const branch = calcBranchRate(countable, presentIds);

  const present = countable.filter((m) => presentIds.has(m.id));
  const absent = countable.filter((m) => !presentIds.has(m.id));

  const matchedRecords = activity.records.filter((r) => r.memberId);
  const otherRecords = activity.records.filter((r) => !r.memberId);

  return NextResponse.json({
    activity,
    branch,
    present,
    absent,
    matchedRecords,
    otherRecords,
    members,
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
