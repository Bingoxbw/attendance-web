import fs from "fs";
import path from "path";

export const TUTORIALS_ROOT = path.join(process.cwd(), "content", "tutorials");

export function resolveTutorialPath(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    return null;
  }
  const full = path.resolve(TUTORIALS_ROOT, normalized);
  const root = path.resolve(TUTORIALS_ROOT);
  if (!full.startsWith(root + path.sep) && full !== root) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return full;
}
