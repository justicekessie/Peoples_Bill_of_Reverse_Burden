import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Clause,
  ClauseUpdateInput,
  Cluster,
  Submission,
  VoteInput,
  VoteStats,
  getClauseVoteStats,
  listBillSubmissions,
  listClauses,
  listClusters,
  submitClauseVote,
  updateClause,
} from '../lib/api'

export function useClauses(slug: string | undefined) {
  return useQuery<Clause[]>({
    queryKey: ['clauses', slug],
    queryFn: () => listClauses(slug as string),
    enabled: !!slug,
    staleTime: 30 * 1000,
  })
}

export function useClusters(slug: string | undefined) {
  return useQuery<Cluster[]>({
    queryKey: ['clusters', slug],
    queryFn: () => listClusters(slug as string),
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
}

export function useClusterSubmissions(slug: string | undefined, clusterId: number | undefined) {
  return useQuery<Submission[]>({
    queryKey: ['submissions', slug, clusterId ?? null],
    queryFn: () => listBillSubmissions(slug as string, { clusterId, limit: 20 }),
    enabled: !!slug && !!clusterId,
    staleTime: 60 * 1000,
  })
}

export function useUpdateClause(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clauseId, input }: { clauseId: number; input: ClauseUpdateInput }) =>
      updateClause(slug, clauseId, input),
    onSuccess: (clause) => {
      queryClient.setQueryData<Clause[] | undefined>(['clauses', slug], (prev) =>
        prev ? prev.map((existing) => (existing.id === clause.id ? clause : existing)) : prev,
      )
    },
  })
}

export function useClauseVoteStats(slug: string | undefined, clauseId: number | undefined) {
  return useQuery<VoteStats>({
    queryKey: ['clause-votes', slug, clauseId],
    queryFn: () => getClauseVoteStats(slug as string, clauseId as number),
    enabled: !!slug && !!clauseId,
    staleTime: 60 * 1000,
  })
}

export function useSubmitClauseVote(slug: string, clauseId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: VoteInput) => submitClauseVote(slug, clauseId, input),
    onSuccess: (stats) => {
      queryClient.setQueryData(['clause-votes', slug, clauseId], stats)
    },
  })
}
