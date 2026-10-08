import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import {
  calcCumulativeBranchRate,
  calcPersonalRates,
  calcBranchRate,
  filterCountableMembers,
  formatPercent,
} from "@/lib/stats/attendance-rate";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const includeActivists =
    req.nextUrl.searchParams.get("includeActivists") === "1";
  const format = req.nextUrl.searchParams.get("format") || "json";

  const members = await prisma.member.findMany();
  const activities = await prisma.activity.findMany({
    orderBy: { importedAt: "asc" },
    include: { records: true },
  });

  const presence = activities.map((a) => ({
    activityId: a.id,
    title: a.title,
    presentMemberIds: new Set(
      a.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    ),
  }));

  const personal = calcPersonalRates(members, presence, includeActivists);
  const cumulative = calcCumulativeBranchRate(
    members,
    presence,
    includeActivists
  );

  const perActivity = activities.map((a) => {
    const presentIds = new Set(
      a.records.filter((r) => r.memberId).map((r) => r.memberId as string)
    );
    const countable = filterCountableMembers(members, includeActivists);
    const branch = calcBranchRate(countable, presentIds);
    return {
      activityId: a.id,
      title: a.title,
      importedAt: a.importedAt,
      ...branch,
      rateLabel: formatPercent(branch.rate),
    };
  });

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const s1 = wb.addWorksheet("个人到达率");
    s1.addRow(["姓名", "学号", "已到次数", "应到次数", "到达率"]);
    for (const p of personal) {
      s1.addRow([
        p.name,
        p.studentId || "",
        p.attended,
        p.total,
        formatPercent(p.rate),
      ]);
    }

    const s2 = wb.addWorksheet("活动到达率");
    s2.addRow(["活动", "已到", "应到", "缺席", "到达率"]);
    for (const a of perActivity) {
      s2.addRow([a.title, a.present, a.total, a.absent, a.rateLabel]);
    }

    s2.addRow([]);
    s2.addRow([
      "累计（人次）",
      cumulative.presentPersonTimes,
      cumulative.expectedPersonTimes,
      "",
      formatPercent(cumulative.rate),
    ]);

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance-stats.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    personal,
    perActivity,
    cumulative: {
      ...cumulative,
      rateLabel: formatPercent(cumulative.rate),
    },
    activityCount: activities.length,
    memberCount: filterCountableMembers(members, includeActivists).length,
  });
}
