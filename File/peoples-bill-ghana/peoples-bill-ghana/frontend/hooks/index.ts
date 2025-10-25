import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast as useToastPrimitive } from '@/components/ui/use-toast'
import * as api from '@/lib/api'

// ============== Data Fetching Hooks ==============

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export const useSubmissions = (params?: {
  skip?: number
  limit?: number
  region?: string
  status?: string
}) => {
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: () => api.getSubmissions(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useClusters = () => {
  return useQuery({
    queryKey: ['clusters'],
    queryFn: api.getClusters,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useBillClauses = () => {
  return useQuery({
    queryKey: ['billClauses'],
    queryFn: api.getBillClauses,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useFullBill = () => {
  return useQuery({
    queryKey: ['fullBill'],
    queryFn: api.getFullBill,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============== Mutation Hooks ==============

export const useSubmitSubmission = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: api.submitSubmission,
    onSuccess: () => {
      // Invalidate stats to update counts
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.response?.data?.detail || 'Please try again later',
        variant: 'destructive',
      })
    },
  })
}

export const useVote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clauseId, vote, region }: {
      clauseId: number
      vote: string
      region?: string
    }) => api.submitVote(clauseId, vote, region),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billClauses'] })
    },
  })
}

// ============== Admin Hooks ==============

export const useAdminLogin = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.adminLogin(username, password),
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: 'Welcome to the admin dashboard',
        variant: 'success',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.response?.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      })
    },
  })
}

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: api.getAdminDashboard,
    staleTime: 30 * 1000, // 30 seconds
    enabled: api.isAuthenticated(),
  })
}

export const useTriggerClustering = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: api.triggerClustering,
    onSuccess: (data) => {
      toast({
        title: 'Clustering complete',
        description: `Created ${data.clusters_created} clusters from ${data.submissions_processed} submissions`,
        variant: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['clusters'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Clustering failed',
        description: error.response?.data?.detail || 'Please try again later',
        variant: 'destructive',
      })
    },
  })
}

export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ submissionId, status }: {
      submissionId: number
      status: 'pending' | 'approved' | 'rejected'
    }) => api.updateSubmissionStatus(submissionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })
      toast({
        title: 'Status updated',
        description: 'Submission status has been updated',
        variant: 'success',
      })
    },
  })
}

export const useCreateBillClause = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: api.createBillClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billClauses'] })
      toast({
        title: 'Clause created',
        description: 'Bill clause has been successfully created',
        variant: 'success',
      })
    },
  })
}

export const useGenerateClause = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (clusterId: number) => api.generateClause(clusterId),
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error.response?.data?.detail || 'Could not generate clause',
        variant: 'destructive',
      })
    },
  })
}

// ============== Utility Hooks ==============

export const useToast = () => {
  const { toast } = useToastPrimitive()

  return {
    toast: (props: {
      title: string
      description?: string
      variant?: 'default' | 'success' | 'destructive'
    }) => {
      const variantStyles = {
        default: '',
        success: 'border-green-200 bg-green-50',
        destructive: 'border-red-200 bg-red-50',
      }

      toast({
        ...props,
        className: variantStyles[props.variant || 'default'],
      })
    },
  }
}

// Auth state hook
export const useAuth = () => {
  const isAuthenticated = api.isAuthenticated()
  const user = api.getCurrentUser()
  const hasRole = (role: string) => api.hasRole(role)

  return {
    isAuthenticated,
    user,
    hasRole,
    logout: api.adminLogout,
  }
}

// Local storage hook for persistence
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }

  return [storedValue, setValue] as const
}

// Window size hook for responsive design
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}
