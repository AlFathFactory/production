import { useQuery } from '@tanstack/react-query'

import { projectsRepository } from '../projectsRepository'
import { projectKeys } from './projectKeys'

export function useLots(projectNumberId: string | null) {
  return useQuery({
    queryKey: projectKeys.lots(projectNumberId ?? 'no-project-number'),
    queryFn: () => projectsRepository.listLots(projectNumberId!),
    enabled: Boolean(projectNumberId),
  })
}
