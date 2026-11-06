import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_BRANCH_NAME } from "@/lib/branch";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
  }

  const studentId = body.studentId ? String(body.studentId).trim() : null;
  const yikatong = body.yikatong ? String(body.yikatong).trim() : null;
  const partyStatus = body.partyStatus
    ? String(body.partyStatus).trim()
    : null;
  const remark = body.remark ? String(body.remark).trim() : null;
  const branchName =
    String(body.branchName || "").trim() || DEFAULT_BRANCH_NAME;
  const isActivist = Boolean(body.isActivist);

  const member = await prisma.member.create({
    data: {
      name,
      studentId,
      yikatong,
      partyStatus,
      remark,
      branchName,
      isActivist,
      needsFix: !studentId && !yikatong,
    },
  });

  return NextResponse.json({ member });
}
