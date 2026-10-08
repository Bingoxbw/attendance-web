import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import {
  calcBranchRate,
  calcCumulativeBranchRate,
  filterCountableMembers,
  formatPercent,
} from "@/lib/stats/attendance-rate";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [memberCount, activityCount, members, activities] = await Promise.all([
    prisma.member.count(),
    prisma.activity.count(),
    prisma.member.findMany(),
    prisma.activity.findMany({
      orderBy: { importedAt: "desc" },
      take: 5,
      include: { records: true },
    }),
  ]);

  const allActivities = await prisma.activity.findMany({
    include: { records: true },
  });

  const presence = allActivities.map((a) => ({
    activityId: a.id,
    title: a.title,
    presentMemberIds: new Set(
      a.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    ),
  }));

  const cumulative = calcCumulativeBranchRate(members, presence, false);
  const latest = activities[0];
  let latestRate = "—";
  if (latest) {
    const presentIds = new Set(
      latest.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    );
    const branch = calcBranchRate(
      filterCountableMembers(members, false),
      presentIds
    );
    latestRate = formatPercent(branch.rate);
  }

  return (
    <AppShell>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "在册成员", value: String(memberCount) },
          { label: "已导入活动", value: String(activityCount) },
          { label: "最近一次到达率", value: latestRate },
          {
            label: "累计到达率（人次）",
            value: activityCount ? formatPercent(cumulative.rate) : "—",
          },
        ].map((c) => (
          <div key={c.label} className="panel p-5">
            <p className="muted text-sm">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-semibold">快捷操作</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/members">
            导入成员名单
          </Link>
          <Link className="btn btn-ghost" href="/activities">
            导入签到/签退表
          </Link>
          <Link className="btn btn-ghost" href="/stats">
            查看统计
          </Link>
          <Link className="btn btn-ghost" href="/guide">
            表头说明
          </Link>
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">最近活动</h2>
          <Link className="muted text-sm" href="/activities">
            全部 →
          </Link>
        </div>
        {activities.length === 0 ? (
          <p className="muted mt-4 text-sm">暂无活动，请先导入签到表。</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {activities.map((a) => {
              const presentIds = new Set(
                a.records
                  .filter((r) => r.memberId)
                  .map((r) => r.memberId as string)
              );
              const branch = calcBranchRate(
                filterCountableMembers(members, false),
                presentIds
              );
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <Link
                      href={`/activities/${a.id}`}
                      className="font-medium hover:text-[var(--brand)]"
                    >
                      {a.title}
                    </Link>
                    <p className="muted text-sm">
                      明细 {a.records.length} 条 · 本支部到 {branch.present}/
                      {branch.total}
                    </p>
                  </div>
                  <span className="badge badge-ok">
                    {formatPercent(branch.rate)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
