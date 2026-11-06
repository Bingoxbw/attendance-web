import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireApiSession();
  if (auth.error) return auth.error;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const docs = await prisma.tutorialDocument.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { relativePath: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  const byCategory: Record<string, typeof docs> = {};
  for (const d of docs) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }

  return NextResponse.json({
    total: docs.length,
    documents: docs,
    byCategory,
  });
}
