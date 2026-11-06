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
  scope: string;
  branchOnly: boolean;
};

export default function SecretaryActivitiesPage() {
  const [branchName, setBranchName] = useState("");
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(withBase("/api/secretary/activities"));
    const d = await res.json();
    setBranchName(d.branchName || "");
    setActivities(d.activities || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMsg("");
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(withBase("/api/secretary/activities/import"), {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    e.target.value = "";
    if (!res.ok) {
      setMsg(data.error || "上传失败");
      return;
    }
    setMsg(
      `已上传本支部专属活动：到课 ${data.summary?.branchPresent ?? "—"} / 缺席 ${data.summary?.branchAbsent ?? "—"}（其他支部不可见）`
    );
    await load();
  }

  return (
    <SecretaryShell branchName={branchName}>
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">本支部活动到达率</h2>
            <p className="muted mt-1 text-sm">
              可上传本支部专属签到表（其他党支部看不到）；共享活动仍会显示。
            </p>
          </div>
          <label className="btn btn-primary cursor-pointer">
            {loading ? "上传中…" : "上传本支部活动"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={loading}
              onChange={onUpload}
            />
          </label>
        </div>
        {msg ? <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p> : null}
      </section>

      <section className="panel mt-6 overflow-x-auto p-5">
        <table className="table">
          <thead>
            <tr>
              <th>活动</th>
              <th>范围</th>
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
                  {a.branchOnly ? (
                    <span className="badge badge-ok">本支部</span>
                  ) : (
                    <span className="badge">共享</span>
                  )}
                </td>
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
          <p className="muted mt-3 text-sm">暂无活动，可先上传本支部签到表。</p>
        ) : null}
      </section>
    </SecretaryShell>
  );
}
