"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Activity = {
  id: string;
  title: string;
  sourceFile: string | null;
  importedAt: string;
  startAt: string | null;
  _count: { records: number };
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/activities/import");
    const data = await res.json();
    setActivities(data.activities || []);
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
    const res = await fetch("/api/activities/import", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);
    e.target.value = "";
    if (!res.ok) {
      setMsg(data.error || "导入失败");
      return;
    }
    const s = data.summary;
    setMsg(
      `导入成功：明细 ${s.totalRows}，匹配 ${s.matched}（学号 ${s.byXuehao} / 一卡通 ${s.byYikatong} / 姓名 ${s.byName}），本支部到 ${s.branchPresent}、缺席 ${s.branchAbsent}`
    );
    await load();
  }

  async function remove(id: string) {
    if (!confirm("确定删除该活动及其签到记录？")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AppShell>
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">活动签到导入</h2>
            <p className="muted mt-1 text-sm">
              上传微信小程序导出的签到/签退 Excel（含活动信息 + 扫码签到数据）
            </p>
          </div>
          <label className="btn btn-primary cursor-pointer">
            {loading ? "导入中…" : "上传签到表"}
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

      <section className="panel mt-6 overflow-x-auto p-4">
        <table className="table">
          <thead>
            <tr>
              <th>活动</th>
              <th>明细条数</th>
              <th>来源文件</th>
              <th>导入时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link
                    className="font-medium hover:text-[var(--brand)]"
                    href={`/activities/${a.id}`}
                  >
                    {a.title}
                  </Link>
                </td>
                <td>{a._count.records}</td>
                <td className="muted text-sm">{a.sourceFile || "—"}</td>
                <td className="muted text-sm">
                  {new Date(a.importedAt).toLocaleString("zh-CN")}
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link className="btn btn-ghost" href={`/activities/${a.id}`}>
                      详情
                    </Link>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => remove(a.id)}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activities.length === 0 ? (
          <p className="muted p-4 text-sm">暂无活动。</p>
        ) : null}
      </section>
    </AppShell>
  );
}
