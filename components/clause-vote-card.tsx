'use client'

import { useEffect, useState } from 'react'

import { Badge, Button, Card, CardBody, Label, Select, Textarea, Input, ProgressBar } from './ui'
import { useClauseVoteStats, useSubmitClauseVote } from '../hooks/useClauses'
import type { Clause, VoteInput, VoteValue, VoterIdentifierType } from '../lib/api'
import { ghanaRegions } from '../lib/design-system'

type StoredVoter = {
  identifier: string
  identifier_type: VoterIdentifierType
  region: string
}

const VOTER_STORAGE_KEY = 'bill-voter-profile'
const VOTED_STORAGE_PREFIX = 'bill-voted-clause:'

function readStoredVoter(): StoredVoter | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(VOTER_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.identifier === 'string' &&
      typeof parsed?.identifier_type === 'string' &&
      typeof parsed?.region === 'string'
    ) {
      return parsed as StoredVoter
    }
  } catch {
    // fall through
  }
  return null
}

function saveStoredVoter(voter: StoredVoter) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VOTER_STORAGE_KEY, JSON.stringify(voter))
}

function markClauseVoted(clauseId: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`${VOTED_STORAGE_PREFIX}${clauseId}`, '1')
}

function hasVotedOnClause(clauseId: number): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(`${VOTED_STORAGE_PREFIX}${clauseId}`) === '1'
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function ClauseVoteCard({ slug, clause }: { slug: string; clause: Clause }) {
  const stats = useClauseVoteStats(slug, clause.id)
  const submitVote = useSubmitClauseVote(slug, clause.id)

  const [voteValue, setVoteValue] = useState<VoteValue>('approve')
  const [identifier, setIdentifier] = useState('')
  const [identifierType, setIdentifierType] = useState<VoterIdentifierType>('phone')
  const [region, setRegion] = useState('')
  const [comment, setComment] = useState('')
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStoredVoter()
    if (stored) {
      setIdentifier(stored.identifier)
      setIdentifierType(stored.identifier_type)
      setRegion(stored.region)
    }
    setVoted(hasVotedOnClause(clause.id))
  }, [clause.id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const payload: VoteInput = {
      vote_value: voteValue,
      identifier: identifier.trim(),
      identifier_type: identifierType,
      region: region || undefined,
      comment: comment.trim() || undefined,
    }
    try {
      await submitVote.mutateAsync(payload)
      saveStoredVoter({
        identifier: payload.identifier,
        identifier_type: payload.identifier_type,
        region: region,
      })
      markClauseVoted(clause.id)
      setVoted(true)
      setComment('')
    } catch (err: unknown) {
      setError(extractErrorMessage(err))
    }
  }

  const data = stats.data
  const total = data?.total ?? 0
  const approveShare = total > 0 ? ((data?.approve ?? 0) / total) * 100 : 0
  const rejectShare = total > 0 ? ((data?.reject ?? 0) / total) * 100 : 0
  const neutralShare = total > 0 ? ((data?.neutral ?? 0) / total) * 100 : 0
  const commentsEnabled = data?.comments_enabled ?? clause.public_comments_enabled ?? true

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ghana-green">
              Section {clause.section_number}
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-ghana-dark">
              {clause.title}
            </h3>
          </div>
          <Badge tone="gold">v{clause.version}</Badge>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-8 text-ghana-ink">{clause.content}</p>

        {clause.rationale ? (
          <div className="rounded-lg border-l-4 border-ghana-green bg-ghana-green/5 px-4 py-3 text-sm leading-7 text-ghana-muted">
            {clause.rationale}
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-ghana-muted">
            <span>Public feedback</span>
            <span>{total} {total === 1 ? 'vote' : 'votes'}</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={data ? data.approval_rate : 0} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-ghana-muted">
            <span>Approve {formatPercent(approveShare)} ({data?.approve ?? 0})</span>
            <span>Reject {formatPercent(rejectShare)} ({data?.reject ?? 0})</span>
            <span>Neutral {formatPercent(neutralShare)} ({data?.neutral ?? 0})</span>
          </div>
        </div>

        {voted ? (
          <div className="rounded-lg border border-ghana-green/20 bg-ghana-green/5 px-4 py-3 text-sm text-ghana-dark">
            Thanks for voting on this clause. Refresh to see how the tallies shift.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Your position</Label>
              <div className="mt-2 inline-flex overflow-hidden rounded-lg border border-border">
                {(['approve', 'reject', 'neutral'] as VoteValue[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVoteValue(value)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
                      voteValue === value
                        ? value === 'approve'
                          ? 'bg-ghana-green text-white'
                          : value === 'reject'
                            ? 'bg-ghana-red text-white'
                            : 'bg-ghana-dark text-white'
                        : 'bg-white text-ghana-ink hover:bg-ghana-cream'
                    }`}
                  >
                    {value === 'approve' ? 'Approve' : value === 'reject' ? 'Reject' : 'Neutral'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
              <div>
                <Label htmlFor={`voter-type-${clause.id}`}>I'm voting with my</Label>
                <Select
                  id={`voter-type-${clause.id}`}
                  value={identifierType}
                  onChange={(event) =>
                    setIdentifierType(event.target.value as VoterIdentifierType)
                  }
                >
                  <option value="phone">Phone number</option>
                  <option value="email">Email address</option>
                  <option value="national_id">National ID</option>
                </Select>
              </div>
              <div>
                <Label htmlFor={`voter-id-${clause.id}`}>
                  {identifierType === 'phone'
                    ? 'Phone number'
                    : identifierType === 'email'
                      ? 'Email address'
                      : 'National ID'}
                </Label>
                <Input
                  id={`voter-id-${clause.id}`}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor={`voter-region-${clause.id}`}>Region (optional)</Label>
                <Select
                  id={`voter-region-${clause.id}`}
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  {ghanaRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {commentsEnabled ? (
              <div>
                <Label htmlFor={`comment-${clause.id}`}>Comment (optional)</Label>
                <Textarea
                  id={`comment-${clause.id}`}
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us why, in your own words."
                />
              </div>
            ) : (
              <p className="text-xs text-ghana-muted">Comments are closed on this clause.</p>
            )}

            {error ? (
              <div className="rounded-lg border border-ghana-red/20 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={submitVote.isPending || identifier.trim().length < 5}>
              {submitVote.isPending ? 'Submitting...' : 'Submit vote'}
            </Button>
          </form>
        )}

        {data && data.recent_comments.length > 0 ? (
          <div className="border-t border-border pt-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ghana-muted">
              Recent comments ({data.comment_count})
            </div>
            <div className="mt-3 space-y-3">
              {data.recent_comments.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-ghana-paper px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-ghana-muted">
                    <span>
                      {item.vote_value === 'approve'
                        ? 'Approve'
                        : item.vote_value === 'reject'
                          ? 'Reject'
                          : 'Neutral'}
                      {item.region ? ` · ${item.region}` : ''}
                    </span>
                    <span>{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-ghana-ink">{item.comment}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  if (err instanceof Error) return err.message
  return 'Could not submit your vote. Please try again.'
}
