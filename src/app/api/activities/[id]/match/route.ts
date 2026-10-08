import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Manually link / unlink a record to a member */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: activityId } = await ctx.params;
  const body = await req.json();
  const recordId = String(body.recordId || "");
  const memberId = body.memberId ? String(body.memberId) : null;

  if (!recordId) {
    return NextResponse.json({ error: "缺少 recordId" }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.findFirst({
    where: { id: recordId, activityId },
  });
  if (!record) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      memberId,
      matchMethod: memberId ? "manual" : "unmatched",
    },
  });

  return NextResponse.json({ record: updated });
}

/** Mark a branch member as present without a raw row (补录) */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id: activityId } = await ctx.params;
  const body = await req.json();
  const memberId = String(body.memberId || "");

  if (!memberId) {
    return NextResponse.json({ error: "缺少 memberId" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: "成员不存在" }, { status: 404 });
  }

  const existing = await prisma.attendanceRecord.findFirst({
    where: { activityId, memberId },
  });
  if (existing) {
    return NextResponse.json({ record: existing, created: false });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      activityId,
      memberId,
      rawName: member.name,
      rawStudentId: member.studentId,
      matchMethod: "manual",
      signedAt: new Date(),
    },
  });

  return NextResponse.json({ record, created: true });
}
