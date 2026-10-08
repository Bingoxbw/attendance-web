import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseAttendanceWorkbook } from "@/lib/excel/parse-attendance";
import {
  buildMemberIndexes,
  matchMember,
} from "@/lib/matching/match-member";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 Excel 文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsed;
  try {
    parsed = await parseAttendanceWorkbook(buffer, file.name);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "解析失败" },
      { status: 400 }
    );
  }

  const members = await prisma.member.findMany();
  if (members.length === 0) {
    return NextResponse.json(
      { error: "请先导入支部成员名单" },
      { status: 400 }
    );
  }

  const indexes = buildMemberIndexes(members);

  const activity = await prisma.activity.create({
    data: {
      title: parsed.meta.title,
      checkInCode: parsed.meta.checkInCode,
      createdAtSrc: parsed.meta.createdAtSrc,
      startAt: parsed.meta.startAt,
      endAt: parsed.meta.endAt,
      address: parsed.meta.address,
      sourceFile: file.name,
      sourceApp: parsed.meta.sourceApp,
      records: {
        create: parsed.rows.map((row) => {
          const match = matchMember(row.rawName, row.rawStudentId, indexes);
          return {
            rawName: row.rawName,
            rawStudentId: row.rawStudentId,
            rawBranchName: row.rawBranchName,
            signedAt: row.signedAt,
            isNewPartyMember: row.isNewPartyMember,
            memberId: match.memberId,
            matchMethod: match.matchMethod,
          };
        }),
      },
    },
    include: { records: true },
  });

  const matchedMemberIds = new Set(
    activity.records.filter((r) => r.memberId).map((r) => r.memberId as string)
  );

  const summary = {
    totalRows: activity.records.length,
    matched: activity.records.filter((r) => r.memberId).length,
    byXuehao: activity.records.filter((r) => r.matchMethod === "xuehao").length,
    byYikatong: activity.records.filter((r) => r.matchMethod === "yikatong")
      .length,
    byName: activity.records.filter((r) => r.matchMethod === "name").length,
    ambiguous: activity.records.filter((r) => r.matchMethod === "ambiguous")
      .length,
    unmatched: activity.records.filter((r) => r.matchMethod === "unmatched")
      .length,
    branchPresent: matchedMemberIds.size,
    branchAbsent: members.filter((m) => !matchedMemberIds.has(m.id)).length,
  };

  return NextResponse.json({ ok: true, activityId: activity.id, summary });
}

export async function GET() {
  const activities = await prisma.activity.findMany({
    orderBy: { importedAt: "desc" },
    include: {
      _count: { select: { records: true } },
    },
  });
  return NextResponse.json({ activities });
}
