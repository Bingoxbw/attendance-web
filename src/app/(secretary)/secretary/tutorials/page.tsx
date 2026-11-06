"use client";

import { useEffect, useState } from "react";
import { SecretaryShell } from "@/components/SecretaryShell";
import { withBase } from "@/lib/paths";

type Doc = {
  id: string;
  title: string;
  category: string;
  ext: string;
  size: number;
  relativePath: string;
};

export default function SecretaryTutorialsPage() {
  const [q, setQ] = useState("");
  const [byCategory, setByCategory] = useState<Record<string, Doc[]>>({});
  const [total, setTotal] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Doc | null>(null);

  async function load(query = q) {
    const res = await fetch(
      withBase(`/api/tutorials?q=${encodeURIComponent(query)}`)
    );
    const data = await res.json();
    setByCategory(data.byCategory || {});
    setTotal(data.total || 0);
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SecretaryShell>
      <section className="panel p-6">
        <h2 className="text-xl font-semibold">支书培训教程</h2>
        <p className="muted mt-1 text-sm">
          共 {total} 份资料。PDF 可在线预览；Word/PPT 请下载后查看。
        </p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
        >
          <input
            className="input max-w-md flex-1"
            placeholder="搜索标题 / 分类 / 路径"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            搜索
          </button>
        </form>
      </section>

      <div className="mt-6 space-y-4">
        {Object.entries(byCategory).map(([category, docs]) => {
          const closed = Boolean(collapsed[category]);
          return (
            <section key={category} className="panel overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/40"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [category]: !c[category] }))
                }
              >
                <span className="font-semibold">
                  {category}（{docs.length}）
                </span>
                <span className="muted text-sm">
                  {closed ? "展开 ▾" : "收起 ▴"}
                </span>
              </button>
              {!closed ? (
                <ul className="space-y-2 border-t border-[var(--line)] px-4 py-3">
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="muted text-xs">
                          .{d.ext} · {(d.size / 1024).toFixed(0)} KB ·{" "}
                          {d.relativePath}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {d.ext === "pdf" ? (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setPreview(d)}
                          >
                            预览
                          </button>
                        ) : null}
                        <a
                          className="btn btn-primary"
                          href={withBase(`/api/tutorials/file?id=${d.id}`)}
                        >
                          下载
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
        {total === 0 ? (
          <section className="panel p-6">
            <p className="muted text-sm">
              暂无教程。请将资料放入 content/tutorials 后运行 npm run
              tutorials:index
            </p>
          </section>
        ) : null}
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="panel flex h-[90vh] w-full max-w-5xl flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{preview.title}</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPreview(null)}
              >
                关闭
              </button>
            </div>
            <iframe
              className="min-h-0 flex-1 rounded-xl border border-[var(--line)] bg-white"
              title={preview.title}
              src={withBase(`/api/tutorials/file?id=${preview.id}&inline=1`)}
            />
          </div>
        </div>
      ) : null}
    </SecretaryShell>
  );
}
