import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseMembersWorkbook } from "@/lib/excel/parse-members";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const mode = String(form.get("mode") || "replace");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 Excel 文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsed;
  try {
    parsed = await parseMembersWorkbook(buffer);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "解析失败" },
      { status: 400 }
    );
  }

  if (parsed.length === 0) {
    return NextResponse.json({ error: "未解析到任何成员" }, { status: 400 });
  }

  if (mode === "replace") {
    await prisma.$transaction([
      prisma.attendanceRecord.updateMany({ data: { memberId: null } }),
      prisma.member.deleteMany(),
    ]);
  }

  await prisma.member.createMany({
    data: parsed.map((m) => ({
      name: m.name,
      yikatong: m.yikatong,
      studentId: m.studentId,
      gender: m.gender,
      phone: m.phone,
      partyStatus: m.partyStatus,
      advisor: m.advisor,
      remark: m.remark,
      roleTag: m.roleTag,
      isActivist: m.isActivist,
      needsFix: m.needsFix,
    })),
  });

  const needsFix = parsed.filter((m) => m.needsFix).length;
  const activists = parsed.filter((m) => m.isActivist).length;

  return NextResponse.json({
    ok: true,
    count: parsed.length,
    needsFix,
    activists,
  });
}

export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: [{ isActivist: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ members });
}
