"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Stats = {
  personal: {
    name: string;
    studentId: string | null;
    attended: number;
    total: number;
    rate: number;
  }[];
  perActivity: {
    activityId: string;
    title: string;
    present: number;
    total: number;
    absent: number;
    rateLabel: string;
  }[];
  cumulative: {
    presentPersonTimes: number;
    expectedPersonTimes: number;
    rateLabel: string;
  };
  activityCount: number;
  memberCount: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [includeActivists, setIncludeActivists] = useState(false);

  async function load(include = includeActivists) {
    const res = await fetch(
      `/api/stats/export?includeActivists=${include ? "1" : "0"}`
    );
    setStats(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">到达率统计</h2>
            <p className="muted mt-1 text-sm">
              个人到达率 = 已到活动数 / 全部已导入活动数；支部累计按人次口径。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeActivists}
                onChange={async (e) => {
                  setIncludeActivists(e.target.checked);
                  await load(e.target.checked);
                }}
              />
              含积极分子
            </label>
            <a
              className="btn btn-primary"
              href={`/api/stats/export?format=xlsx&includeActivists=${includeActivists ? "1" : "0"}`}
            >
              导出 Excel
            </a>
          </div>
        </div>

        {stats ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">应计成员</p>
              <p className="mt-1 text-2xl font-semibold">{stats.memberCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">活动数</p>
              <p className="mt-1 text-2xl font-semibold">{stats.activityCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">累计到达率</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--brand)]">
                {stats.cumulative.rateLabel}
              </p>
              <p className="muted text-xs">
                {stats.cumulative.presentPersonTimes}/
                {stats.cumulative.expectedPersonTimes} 人次
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel overflow-x-auto p-5">
          <h3 className="font-semibold">个人到达率</h3>
          <table className="table mt-3">
            <thead>
              <tr>
                <th>姓名</th>
                <th>已到/应到</th>
                <th>到达率</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.personal || []).map((p) => (
                <tr key={p.name + (p.studentId || "")}>
                  <td>
                    {p.name}
                    {p.studentId ? (
                      <span className="muted text-xs"> · {p.studentId}</span>
                    ) : null}
                  </td>
                  <td>
                    {p.attended}/{p.total}
                  </td>
                  <td>{(p.rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel overflow-x-auto p-5">
          <h3 className="font-semibold">各次活动支部到达率</h3>
          <table className="table mt-3">
            <thead>
              <tr>
                <th>活动</th>
                <th>到/应</th>
                <th>到达率</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.perActivity || []).map((a) => (
                <tr key={a.activityId}>
                  <td>{a.title}</td>
                  <td>
                    {a.present}/{a.total}
                  </td>
                  <td>{a.rateLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
