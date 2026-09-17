import { useQuery } from '@tanstack/react-query'

import { usersRepository } from '../usersRepository'
import type { UserFilters } from '../types'

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersRepository.listUsers(filters),
  })
}