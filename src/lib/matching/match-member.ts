export type MatchableMember = {
  id: string;
  name: string;
  studentId: string | null;
  yikatong: string | null;
};

export type MatchResult = {
  memberId: string | null;
  matchMethod: "xuehao" | "yikatong" | "name" | "unmatched" | "ambiguous";
};

export function buildMemberIndexes(members: MatchableMember[]) {
  const byStudentId = new Map<string, MatchableMember>();
  const byYikatong = new Map<string, MatchableMember>();
  const byName = new Map<string, MatchableMember[]>();

  for (const m of members) {
    if (m.studentId) byStudentId.set(m.studentId, m);
    if (m.yikatong) byYikatong.set(m.yikatong, m);
    const list = byName.get(m.name) || [];
    list.push(m);
    byName.set(m.name, list);
  }

  return { byStudentId, byYikatong, byName };
}

export function matchMember(
  rawName: string,
  rawStudentId: string | null,
  indexes: ReturnType<typeof buildMemberIndexes>
): MatchResult {
  const sid = (rawStudentId || "").trim();

  if (sid) {
    const byXuehao = indexes.byStudentId.get(sid);
    if (byXuehao) return { memberId: byXuehao.id, matchMethod: "xuehao" };

    const byYikatong = indexes.byYikatong.get(sid);
    if (byYikatong) return { memberId: byYikatong.id, matchMethod: "yikatong" };
  }

  const nameHits = indexes.byName.get(rawName.trim()) || [];
  if (nameHits.length === 1) {
    return { memberId: nameHits[0].id, matchMethod: "name" };
  }
  if (nameHits.length > 1) {
    return { memberId: null, matchMethod: "ambiguous" };
  }

  return { memberId: null, matchMethod: "unmatched" };
}
