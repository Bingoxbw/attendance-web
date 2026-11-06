"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SecretaryShell } from "@/components/SecretaryShell";
import { withBase } from "@/lib/paths";

type Overview = {
  branchName: string;
  displayName?: string;
  memberCount: number;
  activityCount: number;
  cumulative: {
    presentPersonTimes: number;
    expectedPersonTimes: number;
    rateLabel: string;
  };
  latest: {
    id: string;
    title: string;
    present: number;
    total: number;
    rateLabel: string;
  } | null;
  topPersonal: {
    name: string;
    studentId: string | null;
    attended: number;
    total: number;
    rate: number;
  }[];
};

export default function SecretaryHomePage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch(withBase("/api/secretary/overview"))
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <SecretaryShell branchName={data?.branchName}>
      <section className="panel p-6">
        <h2 className="text-xl font-semibold">本支部总览</h2>
        <p className="muted mt-1 text-sm">
          {data?.displayName ? `${data.displayName}，` : ""}
          仅可查看本支部成员与活动到达情况。
        </p>
        {data ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">应计成员</p>
              <p className="mt-1 text-2xl font-semibold">{data.memberCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">活动数</p>
              <p className="mt-1 text-2xl font-semibold">{data.activityCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="muted text-sm">累计到达率</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--brand)]">
                {data.cumulative.rateLabel}
              </p>
              <p className="muted text-xs">
                {data.cumulative.presentPersonTimes}/
                {data.cumulative.expectedPersonTimes} 人次
              </p>
            </div>
          </div>
        ) : (
          <p className="muted mt-4 text-sm">加载中…</p>
        )}
      </section>

      {data?.latest ? (
        <section className="panel mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">最近活动</h3>
              <p className="mt-1">{data.latest.title}</p>
              <p className="muted mt-1 text-sm">
                到课 {data.latest.present}/{data.latest.total} ·{" "}
                {data.latest.rateLabel}
              </p>
            </div>
            <Link
              className="btn btn-primary"
              href={`/secretary/activities/${data.latest.id}`}
            >
              查看详情
            </Link>
          </div>
        </section>
      ) : null}

      <section className="panel mt-6 overflow-x-auto p-5">
        <h3 className="font-semibold">个人到达率（节选）</h3>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>姓名</th>
              <th>已到/应到</th>
              <th>到达率</th>
            </tr>
          </thead>
          <tbody>
            {(data?.topPersonal || []).map((p) => (
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
    </SecretaryShell>
  );
}
