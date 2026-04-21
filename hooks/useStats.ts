import { useQuery } from '@tanstack/react-query'
import { getStats } from '../lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}