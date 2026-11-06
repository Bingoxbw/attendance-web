"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/paths";

type Reply = {
  id: string;
  body: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
};

type Thread = {
  id: string;
  title: string;
  body: string;
  authorRole: string;
  authorName: string;
  createdAt: string;
  replies: Reply[];
};

export function QaBoard({ canModerate }: { canModerate: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [editThread, setEditThread] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);

  async function load() {
    const res = await fetch(withBase("/api/qa/threads"));
    const data = await res.json();
    setThreads(data.threads || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch(withBase("/api/qa/threads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "发布失败");
      return;
    }
    setTitle("");
    setBody("");
    setMsg("问题已发布");
    await load();
  }

  async function onReply(threadId: string) {
    const text = (replyDraft[threadId] || "").trim();
    if (!text) return;
    const res = await fetch(withBase(`/api/qa/threads/${threadId}/replies`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (!res.ok) {
      setMsg("回复失败");
      return;
    }
    setReplyDraft((d) => ({ ...d, [threadId]: "" }));
    await load();
  }

  async function saveEdit() {
    if (!editThread) return;
    const res = await fetch(withBase(`/api/qa/threads/${editThread.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editThread.title,
        body: editThread.body,
      }),
    });
    if (!res.ok) {
      setMsg("编辑失败");
      return;
    }
    setEditThread(null);
    await load();
  }

  async function removeThread(id: string) {
    if (!confirm("确定删除该问题及全部回复？")) return;
    await fetch(withBase(`/api/qa/threads/${id}`), { method: "DELETE" });
    await load();
  }

  async function removeReply(id: string) {
    if (!confirm("确定删除该回复？")) return;
    await fetch(withBase(`/api/qa/replies/${id}`), { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h2 className="text-xl font-semibold">支部书记问题咨询</h2>
        <p className="muted mt-1 text-sm">
          实名公开留言：可提问、可回答他人；管理员可编辑与删除。
        </p>
        {msg ? <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p> : null}
        <form className="mt-4 space-y-3" onSubmit={onCreate}>
          <input
            className="input"
            placeholder="问题标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="input min-h-28"
            placeholder="问题详情"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            发布问题
          </button>
        </form>
      </section>

      {threads.map((t) => (
        <section key={t.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{t.title}</h3>
              <p className="muted mt-1 text-xs">
                {t.authorName}
                {t.authorRole === "admin" ? "（管理员）" : "（支书）"} ·{" "}
                {new Date(t.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
            {canModerate ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setEditThread({
                      id: t.id,
                      title: t.title,
                      body: t.body,
                    })
                  }
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeThread(t.id)}
                >
                  删除
                </button>
              </div>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{t.body}</p>

          <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
            <p className="text-sm font-medium">回复（{t.replies.length}）</p>
            {t.replies.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--line)] bg-white/60 px-3 py-2 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="muted text-xs">
                    {r.authorName}
                    {r.authorRole === "admin" ? "（管理员）" : "（支书）"} ·{" "}
                    {new Date(r.createdAt).toLocaleString("zh-CN")}
                  </p>
                  {canModerate ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeReply(r.id)}
                    >
                      删除
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1"
                placeholder="写回复…"
                value={replyDraft[t.id] || ""}
                onChange={(e) =>
                  setReplyDraft((d) => ({ ...d, [t.id]: e.target.value }))
                }
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onReply(t.id)}
              >
                回复
              </button>
            </div>
          </div>
        </section>
      ))}

      {threads.length === 0 ? (
        <section className="panel p-6">
          <p className="muted text-sm">还没有问题，来发第一个吧。</p>
        </section>
      ) : null}

      {editThread ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="panel w-full max-w-lg space-y-3 p-5">
            <h3 className="font-semibold">编辑问题</h3>
            <input
              className="input"
              value={editThread.title}
              onChange={(e) =>
                setEditThread({ ...editThread, title: e.target.value })
              }
            />
            <textarea
              className="input min-h-32"
              value={editThread.body}
              onChange={(e) =>
                setEditThread({ ...editThread, body: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary" onClick={saveEdit}>
                保存
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditThread(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
