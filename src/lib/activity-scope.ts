/** Activities visible to a secretary: shared (null) + own branch only. */
export function secretaryActivityWhere(branchName: string) {
  return {
    OR: [{ branchName: null }, { branchName }],
  };
}

export function canSecretaryAccessActivity(
  activityBranchName: string | null | undefined,
  secretaryBranchName: string
): boolean {
  return (
    activityBranchName == null || activityBranchName === secretaryBranchName
  );
}
