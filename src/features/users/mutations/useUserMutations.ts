import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usersRepository } from '../usersRepository'
import type { UpdateUserInput } from '../types'
import { userKeys } from '../queries/userQueries'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => usersRepository.updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}