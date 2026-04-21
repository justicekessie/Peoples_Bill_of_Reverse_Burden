'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useBill } from '@/hooks/useBills'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ProgressBar,
} from '@/components/ui'
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

      {bill.stage === 'drafting' ? (
        <Card className="mt-10">
          <CardBody>
            <p className="text-sm text-ghana-muted">
              This bill passed its signature threshold and is now being drafted. Public
              input on clauses is welcome.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </main>
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
