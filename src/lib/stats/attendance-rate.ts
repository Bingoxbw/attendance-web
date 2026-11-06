export type MemberForStats = {
  id: string;
  name: string;
  studentId: string | null;
  isActivist: boolean;
  partyStatus: string | null;
  remark: string | null;
  branchName?: string | null;
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

/** Per organizational branch (党支部), cumulative person-times over all activities. */
export function calcPerBranchRates(
  members: MemberForStats[],
  activities: ActivityPresence[],
  includeActivists: boolean
) {
  const countable = filterCountableMembers(members, includeActivists);
  const byBranch = new Map<string, MemberForStats[]>();
  for (const m of countable) {
    const key = (m.branchName || "").trim() || "未分支部";
    if (!byBranch.has(key)) byBranch.set(key, []);
    byBranch.get(key)!.push(m);
  }

  return [...byBranch.entries()]
    .map(([branchName, list]) => {
      const cumulative = calcCumulativeBranchRate(
        list,
        activities,
        true // already filtered
      );
      const latest = activities[activities.length - 1];
      let latestPresent = 0;
      const latestTotal = list.length;
      if (latest) {
        latestPresent = list.filter((m) =>
          latest.presentMemberIds.has(m.id)
        ).length;
      }
      return {
        branchName,
        memberCount: list.length,
        presentPersonTimes: cumulative.presentPersonTimes,
        expectedPersonTimes: cumulative.expectedPersonTimes,
        rate: cumulative.rate,
        rateLabel: formatPercent(cumulative.rate),
        latestPresent,
        latestTotal,
        latestRateLabel:
          latestTotal === 0
            ? "—"
            : formatPercent(latestPresent / latestTotal),
      };
    })
    .sort((a, b) => a.branchName.localeCompare(b.branchName, "zh"));
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
