import { useQuery } from '@tanstack/react-query'

import { bendingRepository } from '../bendingRepository'

const BENDING_KEY = 'bending'

export const bendingKeys = {
  all: [BENDING_KEY] as const,
  destinationData: [BENDING_KEY, 'destination'] as const,
  destinations: () => [BENDING_KEY, 'destination', 'list'] as const,
  destinationSummaries: () => [BENDING_KEY, 'destination', 'summaries'] as const,
  destinationInventory: (destinationId: string | null) => [BENDING_KEY, 'destination', 'inventory', destinationId] as const,
  dispatches: (lotId: string | null) => [BENDING_KEY, 'dispatches', lotId] as const,
  returnLines: (dispatchId: string | null) => [BENDING_KEY, 'return-lines', dispatchId] as const,
}

export function useBendingDestinations() {
  return useQuery({
    queryFn: () => bendingRepository.listDestinations(),
    queryKey: bendingKeys.destinations(),
  })
}

export function useBendingDestinationSummaries() {
  return useQuery({
    queryFn: () => bendingRepository.listDestinationSummaries(),
    queryKey: bendingKeys.destinationSummaries(),
  })
}

export function useBendingDestinationInventory(destinationId: string | null) {
  return useQuery({
    enabled: Boolean(destinationId),
    queryFn: () => bendingRepository.searchDestinationInventory(destinationId as string),
    queryKey: bendingKeys.destinationInventory(destinationId),
  })
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
