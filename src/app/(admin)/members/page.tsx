"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withBase } from "@/lib/paths";
import { DEFAULT_BRANCH_NAME } from "@/lib/branch";

type Member = {
  id: string;
  name: string;
  studentId: string | null;
  yikatong: string | null;
  partyStatus: string | null;
  remark: string | null;
  roleTag: string | null;
  branchName: string;
  isActivist: boolean;
  needsFix: boolean;
};

type AddForm = {
  name: string;
  studentId: string;
  yikatong: string;
  partyStatus: string;
  remark: string;
  branchName: string;
  isActivist: boolean;
};

const emptyAdd = (): AddForm => ({
  name: "",
  studentId: "",
  yikatong: "",
  partyStatus: "",
  remark: "",
  branchName: DEFAULT_BRANCH_NAME,
  isActivist: false,
});

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ studentId: "", yikatong: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch(withBase("/api/members/import"));
    const data = await res.json();
    setMembers(data.members || []);
  }

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) {
      const key = m.branchName || DEFAULT_BRANCH_NAME;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "zh"));
  }, [members]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMsg("");
    const form = new FormData();
    form.set("file", file);
    form.set("mode", "replace");
    const res = await fetch(withBase("/api/members/import"), {
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
    setMsg(
      `已导入 ${data.count} 人（积极分子 ${data.activists}，待补全 ${data.needsFix}）`
    );
    await load();
  }

  async function saveEdit(id: string) {
    const res = await fetch(withBase(`/api/members/${id}`), {
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

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch(withBase("/api/members"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "添加失败");
      return;
    }
    setMsg(`已添加成员：${addForm.name}`);
    setAddForm(emptyAdd());
    setShowAdd(false);
    await load();
  }

  async function onDelete(m: Member) {
    if (!confirm(`确定删除成员「${m.name}」？相关签到匹配会解除关联。`)) return;
    const res = await fetch(withBase(`/api/members/${m.id}`), {
      method: "DELETE",
    });
    if (!res.ok) {
      setMsg("删除失败");
      return;
    }
    setMsg(`已删除：${m.name}`);
    await load();
  }

  function toggleBranch(name: string) {
    setCollapsed((c) => ({ ...c, [name]: !c[name] }));
  }

  return (
    <AppShell>
      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">成员管理</h2>
            <p className="muted mt-1 text-sm">
              可导入 Excel，也可手动添加 / 删除；按党支部折叠查看
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAdd((v) => !v)}
            >
              {showAdd ? "取消添加" : "手动添加"}
            </button>
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
        </div>
        {msg ? <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p> : null}

        {showAdd ? (
          <form
            className="mt-5 grid gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4 sm:grid-cols-2"
            onSubmit={onAdd}
          >
            <label className="text-sm">
              姓名 *
              <input
                className="input mt-1"
                required
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              党支部
              <input
                className="input mt-1"
                value={addForm.branchName}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, branchName: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              学号
              <input
                className="input mt-1"
                value={addForm.studentId}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, studentId: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              一卡通
              <input
                className="input mt-1"
                value={addForm.yikatong}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, yikatong: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              身份
              <input
                className="input mt-1"
                placeholder="如 2025级硕士生"
                value={addForm.partyStatus}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, partyStatus: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              备注
              <input
                className="input mt-1"
                value={addForm.remark}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, remark: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={addForm.isActivist}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, isActivist: e.target.checked }))
                }
              />
              积极分子（默认不计入到达率）
            </label>
            <div className="sm:col-span-2">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                确认添加
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <div className="mt-6 space-y-4">
        {groups.map(([branch, list]) => {
          const isClosed = Boolean(collapsed[branch]);
          const activists = list.filter((m) => m.isActivist).length;
          const needsFix = list.filter((m) => m.needsFix).length;
          const formal = list.length - activists;
          return (
            <section key={branch} className="panel overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/40"
                onClick={() => toggleBranch(branch)}
              >
                <div>
                  <p className="font-semibold">{branch}</p>
                  <p className="muted mt-0.5 text-sm">
                    共 {list.length} 人 · 正式/预备口径 {formal} · 积极分子{" "}
                    {activists}
                    {needsFix ? ` · 待补全 ${needsFix}` : ""}
                  </p>
                </div>
                <span className="muted text-sm">{isClosed ? "展开 ▾" : "收起 ▴"}</span>
              </button>

              {!isClosed ? (
                <div className="overflow-x-auto border-t border-[var(--line)] px-2 pb-2">
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
                      {list.map((m) => (
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
                                  setDraft((d) => ({
                                    ...d,
                                    studentId: e.target.value,
                                  }))
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
                                  setDraft((d) => ({
                                    ...d,
                                    yikatong: e.target.value,
                                  }))
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
                              <span className="badge badge-danger ml-1">
                                待补全
                              </span>
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
                              <div className="flex gap-2">
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
                                <button
                                  className="btn btn-danger"
                                  type="button"
                                  onClick={() => onDelete(m)}
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          );
        })}

        {members.length === 0 ? (
          <section className="panel p-6">
            <p className="muted text-sm">暂无成员，请上传名单或手动添加。</p>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
