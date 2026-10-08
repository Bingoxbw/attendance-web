"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "登录失败");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="panel p-8">
        <p className="text-sm tracking-[0.2em] text-[var(--brand)]">
          ADMIN LOGIN
        </p>
        <h1 className="mt-2 text-3xl font-semibold">支部签到统计</h1>
        <p className="muted mt-2 text-sm">请输入管理员密码进入系统</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <input
            className="input"
            type="password"
            placeholder="管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "登录中…" : "进入系统"}
          </button>
        </form>
      </div>
    </div>
  );
}
