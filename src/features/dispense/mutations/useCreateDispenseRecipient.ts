import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dispenseRepository } from '../dispenseRepository'
import { dispenseKeys } from '../queries/dispenseQueries'

interface CreateDispenseRecipientInput {
  createdBy: string
  name: string
}

export function useCreateDispenseRecipient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ createdBy, name }: CreateDispenseRecipientInput) => dispenseRepository.createRecipient(name, createdBy),
    onSettled: () => queryClient.invalidateQueries({ queryKey: dispenseKeys.recipients }),
  })
}
