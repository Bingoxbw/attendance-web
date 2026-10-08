"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "总览" },
  { href: "/members", label: "成员" },
  { href: "/activities", label: "活动" },
  { href: "/stats", label: "统计" },
  { href: "/guide", label: "说明" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.2em] text-[var(--brand)]">
            BRANCH ATTENDANCE
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            支部活动签到统计
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          <button type="button" className="btn btn-ghost ml-2" onClick={logout}>
            退出
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
