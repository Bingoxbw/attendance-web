"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SecretaryShell } from "@/components/SecretaryShell";
import { withBase } from "@/lib/paths";

type Member = { id: string; name: string; studentId: string | null };

type Detail = {
  branchName: string;
  activity: { id: string; title: string; address: string | null };
  branch: {
    present: number;
    total: number;
    absent: number;
    rateLabel: string;
  };
  present: Member[];
  absent: Member[];
};

export default function SecretaryActivityDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(withBase(`/api/secretary/activities/${id}`))
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  return (
    <SecretaryShell branchName={data?.branchName}>
      <p className="mb-4">
        <Link className="muted text-sm" href="/secretary/activities">
          ← 返回活动列表
        </Link>
      </p>
      {!data ? (
        <p className="muted">加载中…</p>
      ) : (
        <>
          <section className="panel p-6">
            <h2 className="text-xl font-semibold">{data.activity.title}</h2>
            <p className="muted mt-1 text-sm">
              {data.activity.address || "地点未填"} · 本支部到达率{" "}
              <span className="font-semibold text-[var(--brand)]">
                {data.branch.rateLabel}
              </span>{" "}
              （{data.branch.present}/{data.branch.total}，缺席{" "}
              {data.branch.absent}）
            </p>
          </section>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="panel p-5">
              <h3 className="font-semibold">到课成员</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.present.map((m) => (
                  <li key={m.id}>
                    {m.name}
                    {m.studentId ? (
                      <span className="muted"> · {m.studentId}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {data.present.length === 0 ? (
                <p className="muted mt-2 text-sm">无人到课</p>
              ) : null}
            </section>
            <section className="panel p-5">
              <h3 className="font-semibold">缺席成员</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {data.absent.map((m) => (
                  <li key={m.id}>
                    {m.name}
                    {m.studentId ? (
                      <span className="muted"> · {m.studentId}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {data.absent.length === 0 ? (
                <p className="muted mt-2 text-sm">全员到课</p>
              ) : null}
            </section>
          </div>
        </>
      )}
    </SecretaryShell>
  );
}
