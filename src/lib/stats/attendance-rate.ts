export type MemberForStats = {
  id: string;
  name: string;
  studentId: string | null;
  isActivist: boolean;
  partyStatus: string | null;
  remark: string | null;
};

export type ActivityPresence = {
  activityId: string;
  title: string;
  presentMemberIds: Set<string>;
};

export function filterCountableMembers(
  members: MemberForStats[],
  includeActivists: boolean
) {
  return members.filter((m) => includeActivists || !m.isActivist);
}

export function calcBranchRate(
  countable: MemberForStats[],
  presentIds: Set<string>
) {
  const total = countable.length;
  const present = countable.filter((m) => presentIds.has(m.id)).length;
  const rate = total === 0 ? 0 : present / total;
  return { total, present, absent: total - present, rate };
}

export function calcPersonalRates(
  members: MemberForStats[],
  activities: ActivityPresence[],
  includeActivists: boolean
) {
  const countable = filterCountableMembers(members, includeActivists);
  const activityCount = activities.length;

  return countable
    .map((m) => {
      const attended = activities.filter((a) =>
        a.presentMemberIds.has(m.id)
      ).length;
      return {
        memberId: m.id,
        name: m.name,
        studentId: m.studentId,
        attended,
        total: activityCount,
        rate: activityCount === 0 ? 0 : attended / activityCount,
      };
    })
    .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name, "zh"));
}

export function calcCumulativeBranchRate(
  members: MemberForStats[],
  activities: ActivityPresence[],
  includeActivists: boolean
) {
  const countable = filterCountableMembers(members, includeActivists);
  let presentPersonTimes = 0;
  const expectedPersonTimes = countable.length * activities.length;

  for (const a of activities) {
    for (const m of countable) {
      if (a.presentMemberIds.has(m.id)) presentPersonTimes += 1;
    }
  }

  return {
    presentPersonTimes,
    expectedPersonTimes,
    rate: expectedPersonTimes === 0 ? 0 : presentPersonTimes / expectedPersonTimes,
  };
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
