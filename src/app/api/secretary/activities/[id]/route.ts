import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  calcBranchRate,
  filterCountableMembers,
  formatPercent,
} from "@/lib/stats/attendance-rate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireApiSession("secretary");
  if (auth.error) return auth.error;
  const branchName = auth.session.branchName!;
  const { id } = await ctx.params;

  const [members, activity] = await Promise.all([
    prisma.member.findMany({
      where: { branchName },
      orderBy: [{ isActivist: "asc" }, { name: "asc" }],
    }),
    prisma.activity.findUnique({
      where: { id },
      include: {
        records: {
          include: { member: true },
        },
      },
    }),
  ]);

  if (!activity) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  const countable = filterCountableMembers(members, false);
  const presentIds = new Set(
    activity.records
      .filter((r) => r.memberId && countable.some((m) => m.id === r.memberId))
      .map((r) => r.memberId as string)
  );
  const branch = calcBranchRate(countable, presentIds);
  const present = countable.filter((m) => presentIds.has(m.id));
  const absent = countable.filter((m) => !presentIds.has(m.id));

  return NextResponse.json({
    branchName,
    activity: {
      id: activity.id,
      title: activity.title,
      address: activity.address,
      startAt: activity.startAt,
      endAt: activity.endAt,
      importedAt: activity.importedAt,
    },
    branch: {
      ...branch,
      rateLabel: formatPercent(branch.rate),
    },
    present,
    absent,
  });
}
