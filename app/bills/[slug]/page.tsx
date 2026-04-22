'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useBill } from '@/hooks/useBills'
import { useClauses } from '@/hooks/useClauses'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ProgressBar,
} from '@/components/ui'
import { ClauseVoteCard } from '@/components/clause-vote-card'
import type { BillStage } from '@/lib/api'

const STAGE_TONE: Record<BillStage, 'neutral' | 'gold' | 'green' | 'dark' | 'red'> = {
  proposed: 'neutral',
  gathering_signatures: 'gold',
  drafting: 'green',
  finalized: 'dark',
  archived: 'red',
}

export default function BillDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const { data: bill, isLoading, error } = useBill(slug)

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-ghana-muted">Loading bill…</p>
      </main>
    )
  }

  if (error || !bill) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-ghana-red">This bill could not be found.</p>
        <Link href="/bills" className="mt-4 inline-block text-ghana-green underline">
          ← Back to all bills
        </Link>
      </main>
    )
  }

  const progress = bill.signature_threshold
    ? (bill.signature_count / bill.signature_threshold) * 100
    : 0

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/bills" className="text-sm text-ghana-muted hover:text-ghana-green">
        ← All bills
      </Link>

      <div className="mt-6 flex flex-col gap-3">
        <Badge tone={STAGE_TONE[bill.stage]} className="self-start">
          {stageLabel(bill.stage)}
        </Badge>
        <h1 className="font-serif text-[clamp(30px,4.5vw,48px)] font-bold leading-[1.1] text-ghana-dark">
          {bill.title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-ghana-muted">{bill.summary}</p>
      </div>

      {bill.stage === 'gathering_signatures' ? (
        <Card className="mt-10">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold text-ghana-dark">
              Signature progress
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between text-sm font-semibold text-ghana-muted">
              <span>
                {bill.signature_count} of {bill.signature_threshold} verified signatures
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={progress} />
            </div>
            <div className="mt-6">
              <Link href={`/bills/${bill.slug}/sign`}>
                <Button>Sign this bill</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {bill.stage === 'proposed' ? (
        <Card className="mt-10">
          <CardBody>
            <p className="text-sm text-ghana-muted">
              This proposal is awaiting moderator review. Once it is activated, citizens
              will be able to sign on.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {bill.stage === 'drafting' || bill.stage === 'finalized' ? (
        <ClausesSection slug={bill.slug} stage={bill.stage} />
      ) : null}
    </main>
  )
}

function ClausesSection({ slug, stage }: { slug: string; stage: BillStage }) {
  const { data: clauses, isLoading, error } = useClauses(slug)

  return (
    <section className="mt-10 space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-ghana-dark">
          {stage === 'finalized' ? 'Final clauses' : 'Draft clauses'}
        </h2>
        <p className="mt-2 text-sm text-ghana-muted">
          {stage === 'finalized'
            ? 'This bill is finalized. Your feedback is still recorded for the legislative record.'
            : 'Read each clause and tell us whether it should stay as drafted. One vote per clause.'}
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ghana-muted">Loading clauses…</p>
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ghana-red">
              Could not load clauses. Please refresh in a moment.
            </p>
          </CardBody>
        </Card>
      ) : !clauses || clauses.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ghana-muted">
              No clauses have been drafted yet. Check back soon.
            </p>
          </CardBody>
        </Card>
      ) : (
        clauses.map((clause) => <ClauseVoteCard key={clause.id} slug={slug} clause={clause} />)
      )}
    </section>
  )
}

function stageLabel(stage: BillStage): string {
  switch (stage) {
    case 'proposed':
      return 'Proposed'
    case 'gathering_signatures':
      return 'Gathering signatures'
    case 'drafting':
      return 'Drafting'
    case 'finalized':
      return 'Finalized'
    case 'archived':
      return 'Archived'
  }
}
