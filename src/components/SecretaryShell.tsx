"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBase } from "@/lib/paths";

const LINKS = [
  { href: "/secretary", label: "总览" },
  { href: "/secretary/members", label: "本支部成员" },
  { href: "/secretary/activities", label: "本支部活动" },
  { href: "/secretary/tutorials", label: "教程" },
  { href: "/secretary/qa", label: "问答" },
];

export function SecretaryShell({
  children,
  branchName,
}: {
  children: React.ReactNode;
  branchName?: string;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch(withBase("/api/auth/logout"), { method: "POST" });
    window.location.href = withBase(`/login?t=${Date.now()}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.2em] text-[var(--brand)]">
            SECRETARY VIEW
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            党支书工作台
          </h1>
          {branchName ? (
            <p className="muted mt-1 text-sm">{branchName}</p>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/secretary"
                ? pathname === "/secretary"
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
