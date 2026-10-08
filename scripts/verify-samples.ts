import fs from "fs";
import path from "path";
import { parseMembersWorkbook } from "../src/lib/excel/parse-members";
import { parseAttendanceWorkbook } from "../src/lib/excel/parse-attendance";
import {
  buildMemberIndexes,
  matchMember,
} from "../src/lib/matching/match-member";

async function main() {
  const samples = path.join(process.cwd(), "samples");
  const files = fs.readdirSync(samples).filter((f) => f.endsWith(".xlsx"));
  const memberFile = files.find((f) => f.includes("支部") || f.includes("信息2026"));
  const attendFile = files.find((f) => f.includes("签退") || f.includes("签到"));

  if (!memberFile || !attendFile) {
    throw new Error(`样例文件不完整: ${files.join(", ")}`);
  }

  const members = await parseMembersWorkbook(
    fs.readFileSync(path.join(samples, memberFile))
  );
  console.log(`members: ${members.length}, activists: ${members.filter((m) => m.isActivist).length}, needsFix: ${members.filter((m) => m.needsFix).length}`);

  const indexed = members.map((m, i) => ({
    id: `m${i}`,
    name: m.name,
    studentId: m.studentId,
    yikatong: m.yikatong,
  }));
  const indexes = buildMemberIndexes(indexed);

  const attend = await parseAttendanceWorkbook(
    fs.readFileSync(path.join(samples, attendFile))
  );
  console.log(`activity: ${attend.meta.title}, rows: ${attend.rows.length}`);

  const methods: Record<string, number> = {};
  const present = new Set<string>();
  for (const row of attend.rows) {
    const m = matchMember(row.rawName, row.rawStudentId, indexes);
    methods[m.matchMethod] = (methods[m.matchMethod] || 0) + 1;
    if (m.memberId) present.add(m.memberId);
  }
  console.log("match methods:", methods);
  console.log(`branch present: ${present.size} / ${indexed.filter((m) => !members[Number(m.id.slice(1))].isActivist).length}`);

  // Acceptance checks from plan
  const checks = [
    ["缪杰豪", "xuehao"],
    ["姚嘉铖", "xuehao"],
    ["胡文豪", "xuehao"],
    ["霍俊皓", "yikatong"],
  ] as const;

  for (const [name, expectMethod] of checks) {
    const row = attend.rows.find((r) => r.rawName === name);
    if (!row) {
      console.error(`FAIL: ${name} not in attendance`);
      process.exitCode = 1;
      continue;
    }
    const result = matchMember(row.rawName, row.rawStudentId, indexes);
    const ok = Boolean(result.memberId) && result.matchMethod === expectMethod;
    const matched = indexed.find((m) => m.id === result.memberId);
    console.log(
      `${ok ? "OK" : "FAIL"}: ${name} -> ${result.matchMethod} member=${matched?.name || "?"} (expect ${expectMethod})`
    );
    if (!ok) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
