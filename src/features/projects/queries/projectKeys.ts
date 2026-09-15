export const projectKeys = {
  all: ['projects'] as const,
  list: () => projectKeys.all,
  numbers: (projectId: string) => ['project-numbers', projectId] as const,
  lots: (projectNumberId: string) => ['lots', projectNumberId] as const,
}
