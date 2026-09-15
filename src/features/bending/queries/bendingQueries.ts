import { useQuery } from '@tanstack/react-query'

import { bendingRepository } from '../bendingRepository'

const BENDING_KEY = 'bending'

export const bendingKeys = {
  all: [BENDING_KEY] as const,
  dispatches: (lotId: string | null) => [BENDING_KEY, 'dispatches', lotId] as const,
  returnLines: (dispatchId: string | null) => [BENDING_KEY, 'return-lines', dispatchId] as const,
}

export function useBendingDispatches(lotId: string | null) {
  return useQuery({
    enabled: Boolean(lotId),
    queryFn: () => bendingRepository.listDispatchesByLot(lotId as string),
    queryKey: bendingKeys.dispatches(lotId),
  })
}

export function useBendingReturnLines(dispatchId: string | null) {
  return useQuery({
    enabled: Boolean(dispatchId),
    queryFn: () => bendingRepository.getReturnLinesForDispatch(dispatchId as string),
    queryKey: bendingKeys.returnLines(dispatchId),
  })
}
