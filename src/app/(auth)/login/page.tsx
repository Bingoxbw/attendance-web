"use client";

import { useRef, useState } from "react";
import { withBase } from "@/lib/paths";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || loading) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(withBase("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "登录失败");
        submitting.current = false;
        setLoading(false);
        return;
      }
      // Keep button disabled until the browser leaves this page.
      window.location.assign(withBase("/"));
    } catch {
      setError("网络异常，请重试");
      submitting.current = false;
      setLoading(false);
    }
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
            disabled={loading}
          />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "登录中，请稍候…" : "进入系统"}
          </button>
        </form>
      </div>
    </div>
  );
}
