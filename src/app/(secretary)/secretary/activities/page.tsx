"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SecretaryShell } from "@/components/SecretaryShell";
import { withBase } from "@/lib/paths";

type ActivityRow = {
  id: string;
  title: string;
  importedAt: string;
  present: number;
  total: number;
  rateLabel: string;
};

export default function SecretaryActivitiesPage() {
  const [branchName, setBranchName] = useState("");
  const [activities, setActivities] = useState<ActivityRow[]>([]);

  useEffect(() => {
    fetch(withBase("/api/secretary/activities"))
      .then((r) => r.json())
      .then((d) => {
        setBranchName(d.branchName || "");
        setActivities(d.activities || []);
      });
  }, []);

  return (
    <SecretaryShell branchName={branchName}>
      <section className="panel overflow-x-auto p-5">
        <h2 className="text-xl font-semibold">本支部活动到达率</h2>
        <p className="muted mt-1 text-sm">点击活动查看到课 / 缺席名单</p>
        <table className="table mt-4">
          <thead>
            <tr>
              <th>活动</th>
              <th>到/应</th>
              <th>到达率</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>
                  {a.present}/{a.total}
                </td>
                <td>{a.rateLabel}</td>
                <td>
                  <Link
                    className="btn btn-ghost"
                    href={`/secretary/activities/${a.id}`}
                  >
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activities.length === 0 ? (
          <p className="muted mt-3 text-sm">暂无活动数据。</p>
        ) : null}
      </section>
    </SecretaryShell>
  );
}
