import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  Bill,
  BillCreateInput,
  BillSignInput,
  BillStage,
  createBill,
  getBill,
  listBills,
  signBill,
  verifySignature,
} from '../lib/api'

export function useBills(stage?: BillStage) {
  return useQuery<Bill[]>({
    queryKey: ['bills', stage ?? 'all'],
    queryFn: () => listBills(stage),
    staleTime: 30 * 1000,
  })
}

export function useBill(slug: string | undefined) {
  return useQuery<Bill>({
    queryKey: ['bill', slug],
    queryFn: () => getBill(slug as string),
    enabled: !!slug,
    staleTime: 30 * 1000,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BillCreateInput) => createBill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

export function useSignBill(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BillSignInput) => signBill(slug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill', slug] })
    },
  })
}

export function useVerifySignature(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (signatureId: number) => verifySignature(slug, signatureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill', slug] })
    },
  })
}
