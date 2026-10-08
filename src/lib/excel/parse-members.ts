import ExcelJS from "exceljs";
import { cellToString } from "./utils";

export type ParsedMember = {
  name: string;
  yikatong: string | null;
  studentId: string | null;
  gender: string | null;
  phone: string | null;
  partyStatus: string | null;
  advisor: string | null;
  remark: string | null;
  roleTag: string | null;
  isActivist: boolean;
  needsFix: boolean;
};

const SKIP_NAME_PATTERNS = [/下方为/, /积极分子/, /^合计/, /^备注/];

function looksLikeHeader(row: string[]): boolean {
  const joined = row.join("|");
  return joined.includes("姓名") && (joined.includes("学号") || joined.includes("一卡通"));
}

export async function parseMembersWorkbook(
  buffer: ArrayBuffer | Buffer
): Promise<ParsedMember[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs typings expect a specialized Buffer alias
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Excel 中没有工作表");

  let headerRow = 1;
  const col: Record<string, number> = {};

  for (let r = 1; r <= Math.min(5, sheet.rowCount); r++) {
    const values: string[] = [];
    sheet.getRow(r).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber] = cellToString(cell.value);
    });
    if (looksLikeHeader(values)) {
      headerRow = r;
      values.forEach((v, idx) => {
        if (!v) return;
        if (v === "姓名" || (v.includes("姓名") && !v.includes("导师"))) col.name = idx;
        else if (v.includes("一卡通")) col.yikatong = idx;
        else if (v === "学号" || (v.includes("学号") && !v.includes("一卡通")))
          col.studentId = idx;
        else if (v.includes("性别")) col.gender = idx;
        else if (v.includes("手机")) col.phone = idx;
        else if (v.includes("党员身份") || v === "身份") col.partyStatus = idx;
        else if (v.includes("导师")) col.advisor = idx;
        else if (v.includes("备注")) col.remark = idx;
      });
      break;
    }
  }

  if (!col.name) {
    throw new Error("未找到「姓名」列，请确认上传的是支部名单表");
  }

  const members: ParsedMember[] = [];
  let inActivistSection = false;

  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (c?: number) => (c ? cellToString(row.getCell(c).value) : "");

    const name = get(col.name);
    if (!name) continue;

    if (SKIP_NAME_PATTERNS.some((p) => p.test(name))) {
      if (/积极分子/.test(name)) inActivistSection = true;
      continue;
    }

    // Extra role tag sometimes sits in the column after remark
    let roleTag: string | null = null;
    const remark = get(col.remark) || null;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const v = cellToString(cell.value);
      if (!v) return;
      if (v === "联络员" || v === "支书" || v === "组织委员") {
        roleTag = v;
      }
      // column after known headers
      if (col.remark && colNumber === col.remark + 1 && ["联络员", "支书", "组织委员"].includes(v)) {
        roleTag = v;
      }
    });

    const studentId = get(col.studentId) || null;
    const yikatong = get(col.yikatong) || null;
    const remarkNorm = remark;
    const isActivist =
      inActivistSection ||
      remarkNorm === "发展" ||
      (get(col.partyStatus) || "").includes("积极");

    members.push({
      name,
      yikatong,
      studentId,
      gender: get(col.gender) || null,
      phone: get(col.phone) || null,
      partyStatus: get(col.partyStatus) || null,
      advisor: get(col.advisor) || null,
      remark: remarkNorm,
      roleTag,
      isActivist,
      needsFix: !studentId && !yikatong,
    });
  }

  return members;
}
