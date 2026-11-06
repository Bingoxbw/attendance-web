"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { withBase } from "@/lib/paths";
import { DEFAULT_BRANCH_NAME } from "@/lib/branch";

type Account = {
  id: string;
  username: string;
  displayName: string;
  branchName: string;
  isActive: boolean;
};

export default function SecretariesPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [branches, setBranches] = useState<string[]>([DEFAULT_BRANCH_NAME]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    displayName: "",
    branchName: DEFAULT_BRANCH_NAME,
  });

  async function load() {
    const [a, b] = await Promise.all([
      fetch(withBase("/api/admin/secretaries")).then((r) => r.json()),
      fetch(withBase("/api/admin/branches")).then((r) => r.json()),
    ]);
    setAccounts(a.accounts || []);
    if (b.branches?.length) setBranches(b.branches);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch(withBase("/api/admin/secretaries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "创建失败");
      return;
    }
    setMsg(`已创建支书账号：${form.username}`);
    setForm({
      username: "",
      password: "",
      displayName: "",
      branchName: form.branchName,
    });
    await load();
  }

  async function toggleActive(a: Account) {
    await fetch(withBase(`/api/admin/secretaries/${a.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    await load();
  }

  async function resetPassword(a: Account) {
    const password = prompt(`为「${a.username}」设置新密码：`);
    if (!password) return;
    await fetch(withBase(`/api/admin/secretaries/${a.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setMsg(`已重置密码：${a.username}`);
  }

  async function remove(a: Account) {
    if (!confirm(`确定删除支书账号「${a.username}」？`)) return;
    await fetch(withBase(`/api/admin/secretaries/${a.id}`), {
      method: "DELETE",
    });
    await load();
  }

  return (
    <AppShell>
      <section className="panel p-6">
        <h2 className="text-xl font-semibold">支书账号</h2>
        <p className="muted mt-1 text-sm">
          为各党支部发放独立登录账号；支书只能查看本支部数据。
        </p>
        {msg ? <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p> : null}

        <form
          className="mt-5 grid gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4 sm:grid-cols-2"
          onSubmit={onCreate}
        >
          <label className="text-sm">
            用户名 *
            <input
              className="input mt-1"
              required
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            初始密码 *
            <input
              className="input mt-1"
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            显示姓名（实名）*
            <input
              className="input mt-1"
              required
              value={form.displayName}
              onChange={(e) =>
                setForm((f) => ({ ...f, displayName: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            绑定党支部 *
            <select
              className="input mt-1"
              value={form.branchName}
              onChange={(e) =>
                setForm((f) => ({ ...f, branchName: e.target.value }))
              }
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button className="btn btn-primary" type="submit">
              创建账号
            </button>
          </div>
        </form>
      </section>

      <section className="panel mt-6 overflow-x-auto p-4">
        <table className="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>党支部</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.username}</td>
                <td>{a.displayName}</td>
                <td>{a.branchName}</td>
                <td>
                  {a.isActive ? (
                    <span className="badge badge-ok">启用</span>
                  ) : (
                    <span className="badge badge-warn">已禁用</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => toggleActive(a)}
                    >
                      {a.isActive ? "禁用" : "启用"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => resetPassword(a)}
                    >
                      重置密码
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => remove(a)}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 ? (
          <p className="muted p-4 text-sm">暂无支书账号。</p>
        ) : null}
      </section>
    </AppShell>
  );
}
