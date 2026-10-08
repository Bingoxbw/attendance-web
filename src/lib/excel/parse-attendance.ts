import ExcelJS from "exceljs";
import { cellToString, parseFlexibleDate } from "./utils";

export type ParsedActivityMeta = {
  title: string;
  checkInCode: string | null;
  createdAtSrc: string | null;
  startAt: Date | null;
  endAt: Date | null;
  address: string | null;
  sourceApp: string | null;
};

export type ParsedAttendanceRow = {
  rawName: string;
  rawStudentId: string | null;
  rawBranchName: string | null;
  signedAt: Date | null;
  isNewPartyMember: boolean | null;
};

export type ParsedAttendanceFile = {
  meta: ParsedActivityMeta;
  rows: ParsedAttendanceRow[];
};

function findSheet(workbook: ExcelJS.Workbook, keywords: string[]) {
  return workbook.worksheets.find((ws) =>
    keywords.some((k) => ws.name.includes(k))
  );
}

function metaFromSheet(sheet: ExcelJS.Worksheet): ParsedActivityMeta {
  const map: Record<string, string> = {};
  sheet.eachRow((row) => {
    const key = cellToString(row.getCell(1).value);
    const val = cellToString(row.getCell(2).value);
    if (key) map[key] = val;
  });

  return {
    title: map["签到主题"] || map["活动主题"] || "未命名活动",
    checkInCode: map["签到序号"] || null,
    createdAtSrc: map["创建日期"] || null,
    startAt: parseFlexibleDate(map["开始日期"]),
    endAt: parseFlexibleDate(map["结束日期"]),
    address: map["签到地址"] || null,
    sourceApp: map["文件来源"] || null,
  };
}

function parseDataSheet(sheet: ExcelJS.Worksheet): ParsedAttendanceRow[] {
  let headerRow = 1;
  const col: Record<string, number> = {};

  for (let r = 1; r <= Math.min(5, sheet.rowCount); r++) {
    const values: string[] = [];
    sheet.getRow(r).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber] = cellToString(cell.value);
    });
    const joined = values.join("|");
    if (joined.includes("姓名") && joined.includes("学号")) {
      headerRow = r;
      values.forEach((v, idx) => {
        if (!v) return;
        if (v.includes("姓名")) col.name = idx;
        else if (v.includes("学号")) col.studentId = idx;
        else if (v.includes("党支部")) col.branch = idx;
        else if (v.includes("签到日期") || v.includes("签到时间")) col.signedAt = idx;
        else if (v.includes("新生")) col.isNew = idx;
      });
      break;
    }
  }

  if (!col.name) throw new Error("未找到签到明细表头（需含姓名、学号）");

  const rows: ParsedAttendanceRow[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (c?: number) => (c ? cellToString(row.getCell(c).value) : "");
    const name = get(col.name);
    if (!name) continue;

    const isNewRaw = get(col.isNew);
    let isNewPartyMember: boolean | null = null;
    if (isNewRaw === "是") isNewPartyMember = true;
    else if (isNewRaw === "否") isNewPartyMember = false;

    rows.push({
      rawName: name,
      rawStudentId: get(col.studentId) || null,
      rawBranchName: get(col.branch) || null,
      signedAt: parseFlexibleDate(row.getCell(col.signedAt).value),
      isNewPartyMember,
    });
  }
  return rows;
}

export async function parseAttendanceWorkbook(
  buffer: ArrayBuffer | Buffer,
  fallbackTitle?: string
): Promise<ParsedAttendanceFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const metaSheet =
    findSheet(workbook, ["活动信息", "签到活动"]) || workbook.worksheets[1];
  const dataSheet =
    findSheet(workbook, ["签到数据", "扫码签到", "签退"]) || workbook.worksheets[0];

  if (!dataSheet) throw new Error("未找到签到数据工作表");

  const meta = metaSheet
    ? metaFromSheet(metaSheet)
    : {
        title: fallbackTitle || "未命名活动",
        checkInCode: null,
        createdAtSrc: null,
        startAt: null,
        endAt: null,
        address: null,
        sourceApp: null,
      };

  if (!meta.title || meta.title === "未命名活动") {
    meta.title = fallbackTitle || meta.title;
  }

  return {
    meta,
    rows: parseDataSheet(dataSheet),
  };
}
