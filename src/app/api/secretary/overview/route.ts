import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  calcBranchRate,
  calcCumulativeBranchRate,
  calcPersonalRates,
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

  const presence = activities.map((a) => ({
    activityId: a.id,
    title: a.title,
    presentMemberIds: new Set(
      a.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    ),
  }));

  const countable = filterCountableMembers(members, false);
  const cumulative = calcCumulativeBranchRate(members, presence, false);
  const personal = calcPersonalRates(members, presence, false).slice(0, 8);

  const latest = activities[0];
  let latestRate = "—";
  let latestPresent = 0;
  let latestTotal = countable.length;
  if (latest) {
    const presentIds = new Set(
      latest.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    );
    const branch = calcBranchRate(countable, presentIds);
    latestPresent = branch.present;
    latestTotal = branch.total;
    latestRate = formatPercent(branch.rate);
  }

  return NextResponse.json({
    branchName,
    displayName: auth.session.displayName,
    memberCount: countable.length,
    activityCount: activities.length,
    cumulative: {
      ...cumulative,
      rateLabel: formatPercent(cumulative.rate),
    },
    latest: latest
      ? {
          id: latest.id,
          title: latest.title,
          present: latestPresent,
          total: latestTotal,
          rateLabel: latestRate,
        }
      : null,
    topPersonal: personal,
  });
}
