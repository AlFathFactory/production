import { useQuery } from '@tanstack/react-query'

import { bomRepository } from '../repositories/bomRepository'
import { bomKeys } from './bomKeys'

export function useBomImport(importId: string | null) {
  return useQuery({
    queryKey: bomKeys.import(importId ?? ''),
    queryFn: () => bomRepository.getImport(importId!),
    enabled: Boolean(importId),
  })
}

export function useBomVersions(groupId: string | null) {
  return useQuery({
    queryKey: bomKeys.versions(groupId ?? ''),
    queryFn: () => bomRepository.listVersions(groupId!),
    enabled: Boolean(groupId),
  })
}

export function useBomCurrentVersion(groupId: string | null) {
  return useQuery({
    queryKey: bomKeys.currentVersion(groupId ?? ''),
    queryFn: () => bomRepository.getCurrentSavedVersionId(groupId!),
    enabled: Boolean(groupId),
  })
}

export function useBomExtractionPreview(importId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.extraction(importId ?? ''),
    queryFn: () => bomRepository.getExtractionPreview(importId!),
    enabled: Boolean(importId && enabled),
  })
}

export function useBomTree(importId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.tree(importId ?? ''),
    queryFn: () => bomRepository.getTree(importId!),
    enabled: Boolean(importId && enabled),
  })
}

export function useBomSummary(importId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.summary(importId ?? ''),
    queryFn: () => bomRepository.getSummary(importId!),
    enabled: Boolean(importId && enabled),
  })
}

export function useBomWarnings(importId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.warnings(importId ?? ''),
    queryFn: () => bomRepository.getWarnings(importId!),
    enabled: Boolean(importId && enabled),
  })
}

export function useBomRolledUpParts(importId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.rollups(importId ?? ''),
    queryFn: () => bomRepository.getRolledUpParts(importId!),
    enabled: Boolean(importId && enabled),
  })
}

export function useBomNodeDetails(nodeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bomKeys.details(nodeId ?? ''),
    queryFn: () => bomRepository.getNodeDetails(nodeId!),
    enabled: Boolean(nodeId && enabled),
  })
}
