import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usersRepository } from '../usersRepository'
import type { CreateUserInput } from '../types'
import { userKeys } from '../queries/userQueries'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersRepository.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}