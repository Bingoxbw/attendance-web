import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const ROOT = path.join(process.cwd(), "content", "tutorials");
const ALLOWED = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".md",
]);

function categorize(rel: string): string {
  if (/发展/.test(rel)) return "党员发展事项";
  if (/撰写|材料|档案/.test(rel)) return "支部材料撰写事项";
  if (/换届|选举/.test(rel)) return "支部换届指导";
  if (/教程|培训|学习/.test(rel)) return "支书培训";
  return "其他";
}

function walk(dir: string, base = ROOT): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

async function main() {
  const prisma = new PrismaClient();
  const files = walk(ROOT).filter((rel) =>
    ALLOWED.has(path.extname(rel).toLowerCase())
  );

  let upserted = 0;
  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const st = fs.statSync(full);
    const ext = path.extname(rel).toLowerCase().replace(/^\./, "");
    const title = path.basename(rel, path.extname(rel));
    const relativePath = rel.split(path.sep).join("/");
    await prisma.tutorialDocument.upsert({
      where: { relativePath },
      create: {
        title,
        category: categorize(relativePath),
        relativePath,
        ext,
        size: st.size,
      },
      update: {
        title,
        category: categorize(relativePath),
        ext,
        size: st.size,
      },
    });
    upserted += 1;
  }

  console.log(`Indexed ${upserted} tutorials under ${ROOT}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
