import { useMutation } from '@tanstack/react-query'

import { authRepository } from '../authRepository'

export function useSignIn() {
  return useMutation({
    mutationFn: authRepository.signIn,
  })
}
