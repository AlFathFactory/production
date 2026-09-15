export const authKeys = {
  all: ['auth'] as const,
  profile: (authUserId: string) =>
    [...authKeys.all, 'profile', authUserId] as const,
}
