/** Shared preview-only designation matching: the first trimmed token, exact and uppercase. */
export function designationCode(value: string | null | undefined): string | null {
  const code = value?.trim().split(/\s+/)[0]?.trim().toUpperCase() ?? ''
  return code || null
}
