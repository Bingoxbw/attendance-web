import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  calcBranchRate,
  filterCountableMembers,
  formatPercent,
} from "@/lib/stats/attendance-rate";

export async function GET() {
  const auth = await requireApiSession("secretary");
  if (auth.error) return auth.error;
  const branchName = auth.session.branchName!;

  const [members, activities] = await Promise.all([
    prisma.member.findMany({ where: { branchName } }),
    prisma.activity.findMany({
      orderBy: { importedAt: "desc" },
      include: { records: true },
    }),
  ]);

  const countable = filterCountableMembers(members, false);

  const list = activities.map((a) => {
    const presentIds = new Set(
      a.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    );
    const branch = calcBranchRate(countable, presentIds);
    return {
      id: a.id,
      title: a.title,
      importedAt: a.importedAt,
      startAt: a.startAt,
      present: branch.present,
      total: branch.total,
      rateLabel: formatPercent(branch.rate),
    };
  });

  return NextResponse.json({ branchName, activities: list });
}
