/** Shared preview-only designation matching: the first trimmed token, exact and uppercase. */
export function designationCode(value: string | null | undefined): string | null {
  const code = value?.trim().split(/\s+/)[0]?.trim().toUpperCase() ?? ''
  return code || null
}

export type DesignationSelectionStatus = 'unselected' | 'pending' | 'saved'

/** Preview-only status; persisted values always win unless the user has a local selection. */
export function designationSelectionStatus(
  persistedTypeId: string | undefined,
  selectedTypeId: string | undefined,
): DesignationSelectionStatus {
  if (!persistedTypeId && !selectedTypeId) return 'unselected'
  if (persistedTypeId && selectedTypeId === persistedTypeId) return 'saved'
  return 'pending'
}
