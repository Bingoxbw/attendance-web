"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

type Member = {
  id: string;
  name: string;
  studentId: string | null;
  isActivist: boolean;
};

type RecordRow = {
  id: string;
  rawName: string;
  rawStudentId: string | null;
  rawBranchName: string | null;
  matchMethod: string;
  memberId: string | null;
  signedAt: string | null;
  member?: Member | null;
};

export default function ActivityDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<{
    activity: { title: string; address: string | null; startAt: string | null; endAt: string | null };
    branch: { present: number; total: number; absent: number; rate: number };
    present: Member[];
    absent: Member[];
    otherRecords: RecordRow[];
    members: Member[];
  } | null>(null);
  const [includeActivists, setIncludeActivists] = useState(false);
  const [msg, setMsg] = useState("");

  async function load(include = includeActivists) {
    const res = await fetch(
      `/api/activities/${id}?includeActivists=${include ? "1" : "0"}`
    );
    if (!res.ok) return;
    setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleActivists(v: boolean) {
    setIncludeActivists(v);
    await load(v);
  }

  async function markPresent(memberId: string) {
    const res = await fetch(`/api/activities/${id}/match`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) {
      setMsg("已补录到课");
      await load();
    }
  }

  async function linkRecord(recordId: string, memberId: string | null) {
    await fetch(`/api/activities/${id}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, memberId }),
    });
    await load();
  }

  if (!data) {
    return (
      <AppShell>
        <p className="muted">加载中…</p>
      </AppShell>
    );
  }

  const rate = `${(data.branch.rate * 100).toFixed(1)}%`;

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/activities" className="muted text-sm">
          ← 返回活动列表
        </Link>
      </div>

      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{data.activity.title}</h2>
            <p className="muted mt-2 text-sm">
              {data.activity.address || "无地址信息"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-[var(--brand)]">{rate}</p>
            <p className="muted text-sm">
              本支部 {data.branch.present}/{data.branch.total} 到课
            </p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeActivists}
            onChange={(e) => toggleActivists(e.target.checked)}
          />
          统计包含积极分子
        </label>
        {msg ? <p className="mt-2 text-sm text-[var(--brand)]">{msg}</p> : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h3 className="font-semibold">到课（{data.present.length}）</h3>
          <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
            {data.present.map((m) => (
              <li key={m.id} className="flex justify-between text-sm">
                <span>
                  {m.name}
                  {m.studentId ? (
                    <span className="muted"> · {m.studentId}</span>
                  ) : null}
                </span>
                <span className="badge badge-ok">已到</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h3 className="font-semibold">缺席（{data.absent.length}）</h3>
          <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
            {data.absent.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {m.name}
                  {m.studentId ? (
                    <span className="muted"> · {m.studentId}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => markPresent(m.id)}
                >
                  补录
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel mt-6 overflow-x-auto p-5">
        <h3 className="font-semibold">未匹配到本支部档案的签到行</h3>
        <p className="muted mt-1 text-sm">
          多为外支部人员；若是本支部成员漏匹配，可手动关联。
        </p>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学号字段</th>
              <th>党支部（表内）</th>
              <th>匹配状态</th>
              <th>手动关联</th>
            </tr>
          </thead>
          <tbody>
            {data.otherRecords.slice(0, 100).map((r) => (
              <tr key={r.id}>
                <td>{r.rawName}</td>
                <td>{r.rawStudentId || "—"}</td>
                <td className="text-sm">{r.rawBranchName || "—"}</td>
                <td>
                  <span className="badge badge-warn">{r.matchMethod}</span>
                </td>
                <td>
                  <select
                    className="select"
                    defaultValue=""
                    onChange={(e) =>
                      linkRecord(r.id, e.target.value || null)
                    }
                  >
                    <option value="">选择本支部成员…</option>
                    {data.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.otherRecords.length === 0 ? (
          <p className="muted mt-3 text-sm">全部签到行均已处理或无外支部记录。</p>
        ) : null}
      </section>
    </AppShell>
  );
}
