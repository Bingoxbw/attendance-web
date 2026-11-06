"use client";

import { useRef, useState } from "react";
import { withBase } from "@/lib/paths";

type LoginRole = "admin" | "secretary";

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>("admin");
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({
          role,
          password,
          username: role === "secretary" ? username : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "登录失败");
        submitting.current = false;
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      window.location.assign(
        withBase(data.role === "secretary" ? "/secretary" : "/")
      );
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
          BRANCH LOGIN
        </p>
        <h1 className="mt-2 text-3xl font-semibold">支部签到统计</h1>
        <p className="muted mt-2 text-sm">
          请选择身份登录（管理员与党支书账号独立）
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`btn ${role === "admin" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setRole("admin")}
            disabled={loading}
          >
            管理员
          </button>
          <button
            type="button"
            className={`btn ${role === "secretary" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setRole("secretary")}
            disabled={loading}
          >
            党支书
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {role === "secretary" ? (
            <input
              className="input"
              type="text"
              placeholder="支书用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
              required
            />
          ) : null}
          <input
            className="input"
            type="password"
            placeholder={role === "admin" ? "管理员密码" : "支书密码"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus={role === "admin"}
            disabled={loading}
            required
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
