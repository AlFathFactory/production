import { useQuery } from '@tanstack/react-query'

import { authRepository } from '../authRepository'
import { authKeys } from './authKeys'

export function useAuthProfile(authUserId: string | undefined) {
  return useQuery({
    queryKey: authKeys.profile(authUserId ?? 'no-session'),
    queryFn: () => authRepository.getUserProfile(authUserId!),
    enabled: Boolean(authUserId),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
