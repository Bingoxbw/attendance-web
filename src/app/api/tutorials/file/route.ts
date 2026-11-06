import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { resolveTutorialPath } from "@/lib/tutorials";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
};

export async function GET(req: NextRequest) {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  const doc = await prisma.tutorialDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const full = resolveTutorialPath(doc.relativePath);
  if (!full) {
    return NextResponse.json({ error: "文件路径无效" }, { status: 404 });
  }

  const buf = fs.readFileSync(full);
  const disposition = req.nextUrl.searchParams.get("inline") === "1"
    ? "inline"
    : "attachment";
  const filename = encodeURIComponent(`${doc.title}.${doc.ext}`);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": MIME[doc.ext] || "application/octet-stream",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${filename}`,
      "Content-Length": String(buf.length),
    },
  });
}
