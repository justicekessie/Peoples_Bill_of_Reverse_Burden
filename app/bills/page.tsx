'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useBills } from '@/hooks/useBills'
import { Badge, Button, Card, CardBody, ProgressBar, SectionHeading } from '@/components/ui'
import type { Bill, BillStage } from '@/lib/api'

const STAGES: Array<{ value: BillStage | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'gathering_signatures', label: 'Gathering signatures' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'finalized', label: 'Finalized' },
]

const STAGE_TONE: Record<BillStage, 'neutral' | 'gold' | 'green' | 'dark' | 'red'> = {
  proposed: 'neutral',
  gathering_signatures: 'gold',
  drafting: 'green',
  finalized: 'dark',
  archived: 'red',
}

export default function BillsIndexPage() {
  const [filter, setFilter] = useState<BillStage | 'all'>('all')
  const stage = filter === 'all' ? undefined : filter
  const { data: bills, isLoading, error } = useBills(stage)

  const sorted = useMemo(() => {
    if (!bills) return []
    return [...bills].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [bills])

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Citizen bills"
          title="Bills on the platform"
          description="Propose a bill, gather 100 signatures, and invite the public to help draft it."
        />
        <Link href="/bills/new">
          <Button>Propose a bill</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              filter === s.value
                ? 'border-ghana-green bg-ghana-green text-white'
                : 'border-border bg-white text-ghana-muted hover:border-ghana-green hover:text-ghana-green'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-4">
        {isLoading ? <p className="text-ghana-muted">Loading bills…</p> : null}
        {error ? <p className="text-ghana-red">Could not load bills.</p> : null}
        {!isLoading && sorted.length === 0 ? (
          <p className="text-ghana-muted">No bills in this stage yet.</p>
        ) : null}
        {sorted.map((bill) => (
          <BillRow key={bill.id} bill={bill} />
        ))}
      </div>
    </main>
  )
}

function BillRow({ bill }: { bill: Bill }) {
  const progress = bill.signature_threshold
    ? (bill.signature_count / bill.signature_threshold) * 100
    : 0

  return (
    <Link href={`/bills/${bill.slug}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-ghana-dark">{bill.title}</h3>
              <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-ghana-muted">
                {bill.summary}
              </p>
            </div>
            <Badge tone={STAGE_TONE[bill.stage]}>{stageLabel(bill.stage)}</Badge>
          </div>

          {bill.stage === 'gathering_signatures' ? (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-ghana-muted">
                <span>
                  {bill.signature_count} / {bill.signature_threshold} verified signatures
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={progress} />
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </Link>
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
