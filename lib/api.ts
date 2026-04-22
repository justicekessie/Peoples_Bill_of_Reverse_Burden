import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('user')
    }

    return Promise.reject(error)
  }
)

export type StatsResponse = {
  total_submissions: number
  total_contributors: number
  regions_represented: number
  clusters_formed: number
  clauses_drafted: number
  average_approval_rate: number
  submissions_by_region: Record<string, number>
  submissions_over_time: Array<{ date: string; count: number }>
  top_themes: Array<{ theme: string; submissions: number; confidence: number }>
  participation_rate?: {
    overall: number
    estimated_participants: number
    by_region: Record<string, number>
  }
  last_updated?: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: {
    id: number
    username: string
    email: string
    role: string
  }
}

export type BillStage =
  | 'proposed'
  | 'gathering_signatures'
  | 'drafting'
  | 'finalized'
  | 'archived'

export type Bill = {
  id: number
  slug: string
  title: string
  summary: string
  stage: BillStage
  signature_threshold: number
  signature_count: number
  originator_user_id: number | null
  created_at: string
  promoted_to_drafting_at: string | null
}

export type BillCreateInput = {
  title: string
  summary: string
}

export type BillSignInput = {
  identifier: string
  identifier_type: 'phone' | 'email' | 'national_id'
  region?: string
}

export type BillSignResponse = {
  signature_id: number
  bill_id: number
  verified: boolean
  message: string
}

export async function getStats() {
  const response = await api.get<StatsResponse>('/api/stats')
  return response.data
}

export async function adminLogin(username: string, password: string) {
  const response = await api.post<LoginResponse>('/api/admin/login', { username, password })

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('auth_token', response.data.access_token)
    window.localStorage.setItem('user', JSON.stringify(response.data.user))
  }

  return response.data
}

export function isAuthenticated() {
  if (typeof window === 'undefined') {
    return false
  }

  return !!window.localStorage.getItem('auth_token')
}

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null
  }

  const user = window.localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export async function listBills(stage?: BillStage) {
  const response = await api.get<Bill[]>('/api/bills', {
    params: stage ? { stage } : undefined,
  })
  return response.data
}

export async function getBill(slug: string) {
  const response = await api.get<Bill>(`/api/bills/${slug}`)
  return response.data
}

export async function createBill(input: BillCreateInput) {
  const response = await api.post<Bill>('/api/bills', input)
  return response.data
}

export async function signBill(slug: string, input: BillSignInput) {
  const response = await api.post<BillSignResponse>(`/api/bills/${slug}/sign`, input)
  return response.data
}

export async function verifySignature(slug: string, signatureId: number) {
  const response = await api.post<BillSignResponse>(
    `/api/bills/${slug}/signatures/${signatureId}/verify`,
    {},
  )
  return response.data
}

export type LegalReviewStatus = 'draft' | 'reviewed' | 'approved'

export type Clause = {
  id: number
  bill_id: number
  section_number: number
  title: string
  content: string
  rationale: string | null
  cluster_id: number
  legal_review_status: LegalReviewStatus
  version: number
  created_at: string
  updated_at: string
}

export type Cluster = {
  id: number
  bill_id: number
  theme: string
  summary: string
  representative_text: string | null
  submission_count: number
  confidence_score: number
  created_at: string
}

export type Submission = {
  id: number
  bill_id: number
  content: string
  region: string
  status: string
  cluster_id: number | null
  created_at: string
}

export type ClauseUpdateInput = {
  section_number?: number
  title?: string
  content?: string
  rationale?: string | null
  legal_review_status?: LegalReviewStatus
  change_reason?: string
}

export async function listClauses(slug: string) {
  const response = await api.get<Clause[]>(`/api/bills/${slug}/clauses`)
  return response.data
}

export async function listClusters(slug: string) {
  const response = await api.get<Cluster[]>(`/api/bills/${slug}/clusters`)
  return response.data
}

export async function listBillSubmissions(
  slug: string,
  options: { clusterId?: number; limit?: number } = {},
) {
  const response = await api.get<Submission[]>(`/api/bills/${slug}/submissions`, {
    params: {
      cluster_id: options.clusterId,
      limit: options.limit,
    },
  })
  return response.data
}

export async function updateClause(slug: string, clauseId: number, input: ClauseUpdateInput) {
  const response = await api.patch<Clause>(
    `/api/bills/${slug}/clauses/${clauseId}`,
    input,
  )
  return response.data
}

export type VoteValue = 'approve' | 'reject' | 'neutral'

export type VoterIdentifierType = 'phone' | 'email' | 'national_id'

export type VoteInput = {
  vote_value: VoteValue
  identifier: string
  identifier_type: VoterIdentifierType
  region?: string
  comment?: string
}

export type CommentItem = {
  id: number
  clause_id: number
  vote_value: VoteValue
  comment: string | null
  region: string | null
  created_at: string
}

export type VoteStats = {
  clause_id: number
  total: number
  approve: number
  reject: number
  neutral: number
  approval_rate: number
  comment_count: number
  comments_enabled: boolean
  recent_comments: CommentItem[]
}

export async function getClauseVoteStats(slug: string, clauseId: number) {
  const response = await api.get<VoteStats>(
    `/api/bills/${slug}/clauses/${clauseId}/votes/stats`,
  )
  return response.data
}

export async function submitClauseVote(slug: string, clauseId: number, input: VoteInput) {
  const response = await api.post<VoteStats>(
    `/api/bills/${slug}/clauses/${clauseId}/votes`,
    input,
  )
  return response.data
}

export default api