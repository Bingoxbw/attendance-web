"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Member = {
  id: string;
  name: string;
  studentId: string | null;
  yikatong: string | null;
  partyStatus: string | null;
  remark: string | null;
  roleTag: string | null;
  isActivist: boolean;
  needsFix: boolean;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ studentId: "", yikatong: "" });

  async function load() {
    const res = await fetch("/api/members/import");
    const data = await res.json();
    setMembers(data.members || []);
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
    form.set("mode", "replace");
    const res = await fetch("/api/members/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    e.target.value = "";
    if (!res.ok) {
      setMsg(data.error || "导入失败");
      return;
    }
    setMsg(
      `已导入 ${data.count} 人（积极分子 ${data.activists}，待补全 ${data.needsFix}）`
    );
    await load();
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: draft.studentId || null,
        yikatong: draft.yikatong || null,
      }),
    });
    if (res.ok) {
      setEditing(null);
      await load();
    }
  }

  return (
    <AppShell>
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">成员管理</h2>
            <p className="muted mt-1 text-sm">
              上传支部名单 Excel（含姓名、一卡通号、学号等列）
            </p>
          </div>
          <label className="btn btn-primary cursor-pointer">
            {loading ? "导入中…" : "上传名单"}
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
              <th>姓名</th>
              <th>学号</th>
              <th>一卡通</th>
              <th>身份</th>
              <th>备注</th>
              <th>标记</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.name}
                  {m.roleTag ? (
                    <span className="badge ml-2">{m.roleTag}</span>
                  ) : null}
                </td>
                <td>
                  {editing === m.id ? (
                    <input
                      className="input"
                      value={draft.studentId}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, studentId: e.target.value }))
                      }
                    />
                  ) : (
                    m.studentId || <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {editing === m.id ? (
                    <input
                      className="input"
                      value={draft.yikatong}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, yikatong: e.target.value }))
                      }
                    />
                  ) : (
                    m.yikatong || <span className="muted">—</span>
                  )}
                </td>
                <td>{m.partyStatus || "—"}</td>
                <td>{m.remark || "—"}</td>
                <td>
                  {m.isActivist ? (
                    <span className="badge badge-warn">积极分子</span>
                  ) : null}
                  {m.needsFix ? (
                    <span className="badge badge-danger ml-1">待补全</span>
                  ) : null}
                </td>
                <td>
                  {editing === m.id ? (
                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => saveEdit(m.id)}
                      >
                        保存
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => setEditing(null)}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditing(m.id);
                        setDraft({
                          studentId: m.studentId || "",
                          yikatong: m.yikatong || "",
                        });
                      }}
                    >
                      编辑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 ? (
          <p className="muted p-4 text-sm">暂无成员，请先上传名单。</p>
        ) : null}
      </section>
    </AppShell>
  );
}
