"use client";

import { useEffect, useState } from "react";
import { SecretaryShell } from "@/components/SecretaryShell";
import { withBase } from "@/lib/paths";

type Member = {
  id: string;
  name: string;
  studentId: string | null;
  yikatong: string | null;
  partyStatus: string | null;
  remark: string | null;
  roleTag: string | null;
  isActivist: boolean;
  needsFix: boolean;
};

export default function SecretaryMembersPage() {
  const [branchName, setBranchName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch(withBase("/api/secretary/members"))
      .then((r) => r.json())
      .then((d) => {
        setBranchName(d.branchName || "");
        setMembers(d.members || []);
      });
  }, []);

  return (
    <SecretaryShell branchName={branchName}>
      <section className="panel overflow-x-auto p-5">
        <h2 className="text-xl font-semibold">本支部成员</h2>
        <p className="muted mt-1 text-sm">只读列表，共 {members.length} 人</p>
        <table className="table mt-4">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学号</th>
              <th>一卡通</th>
              <th>身份</th>
              <th>备注</th>
              <th>标记</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.name}
                  {m.roleTag ? (
                    <span className="badge ml-2">{m.roleTag}</span>
                  ) : null}
                </td>
                <td>{m.studentId || "—"}</td>
                <td>{m.yikatong || "—"}</td>
                <td>{m.partyStatus || "—"}</td>
                <td>{m.remark || "—"}</td>
                <td>
                  {m.isActivist ? (
                    <span className="badge badge-warn">积极分子</span>
                  ) : null}
                  {m.needsFix ? (
                    <span className="badge badge-danger ml-1">待补全</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </SecretaryShell>
  );
}
