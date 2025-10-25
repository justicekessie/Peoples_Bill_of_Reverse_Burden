import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============== Public API Functions ==============

export const submitSubmission = async (data: {
  content: string
  region: string
  age?: number
  occupation?: string
  language: string
}) => {
  const response = await api.post('/api/submissions', data)
  return response.data
}

export const getSubmissions = async (params?: {
  skip?: number
  limit?: number
  region?: string
  status?: string
}) => {
  const response = await api.get('/api/submissions', { params })
  return response.data
}

export const getClusters = async () => {
  const response = await api.get('/api/clusters')
  return response.data
}

export const getBillClauses = async () => {
  const response = await api.get('/api/bill/clauses')
  return response.data
}

export const getFullBill = async () => {
  const response = await api.get('/api/bill/full')
  return response.data
}

export const getStats = async () => {
  const response = await api.get('/api/stats')
  return response.data
}

export const submitVote = async (clauseId: number, vote: string, region?: string) => {
  const response = await api.post('/api/vote', {
    clause_id: clauseId,
    vote,
    region
  })
  return response.data
}

// ============== Admin API Functions ==============

export const adminLogin = async (username: string, password: string) => {
  const response = await api.post('/api/admin/login', { username, password })
  const { access_token, user } = response.data
  
  // Store token
  localStorage.setItem('auth_token', access_token)
  localStorage.setItem('user', JSON.stringify(user))
  
  return response.data
}

export const adminLogout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  window.location.href = '/admin/login'
}

export const getAdminDashboard = async () => {
  const response = await api.get('/api/admin/dashboard')
  return response.data
}

export const triggerClustering = async () => {
  const response = await api.post('/api/admin/cluster')
  return response.data
}

export const updateSubmissionStatus = async (
  submissionId: number,
  status: 'pending' | 'approved' | 'rejected'
) => {
  const response = await api.put(`/api/admin/submissions/${submissionId}/status`, null, {
    params: { status }
  })
  return response.data
}

export const createBillClause = async (data: {
  cluster_id: number
  section_number: number
  title: string
  content: string
  rationale?: string
}) => {
  const response = await api.post('/api/admin/clauses', data)
  return response.data
}

export const generateClause = async (clusterId: number) => {
  const response = await api.post(`/api/admin/generate-clause/${clusterId}`)
  return response.data
}

export const exportSubmissionsCSV = async () => {
  const response = await api.get('/api/export/submissions.csv', {
    responseType: 'blob'
  })
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `submissions-${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}

export const exportBillPDF = async () => {
  const response = await api.get('/api/export/bill.pdf')
  // For now returns JSON, in Phase 2 will return actual PDF
  return response.data
}

// ============== Utility Functions ==============

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token')
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const hasRole = (requiredRole: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false
  
  if (requiredRole === 'moderator') {
    return ['admin', 'moderator', 'legal_reviewer'].includes(user.role)
  }
  
  return user.role === requiredRole
}

export default api
