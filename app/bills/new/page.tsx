'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useCreateBill } from '@/hooks/useBills'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Label,
  SectionHeading,
  Textarea,
} from '@/components/ui'

export default function NewBillPage() {
  const router = useRouter()
  const createBill = useCreateBill()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    try {
      const bill = await createBill.mutateAsync({ title, summary })
      router.push(`/bills/${bill.slug}`)
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err))
    }
  }

  const titleTooShort = title.length > 0 && title.length < 10
  const summaryTooShort = summary.length > 0 && summary.length < 50

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <SectionHeading
        eyebrow="Originate a bill"
        title="Propose a new bill"
        description="Describe the subject matter and the change you want to see. Once a moderator confirms the proposal is in scope, you can invite the public to sign on."
      />

      <form onSubmit={handleSubmit} className="mt-10">
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ghana-green">
              Step 1 of 3
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ghana-dark">
              The subject matter
            </h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <Label htmlFor="title">Bill title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A Bill to protect whistleblowers in the public service"
                minLength={10}
                maxLength={300}
                required
              />
              {titleTooShort ? (
                <p className="mt-2 text-xs text-ghana-red">Title must be at least 10 characters.</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe what the bill should do and why it matters. This is what citizens will read before deciding whether to sign on."
                minLength={50}
                maxLength={5000}
                required
              />
              <p className="mt-2 text-xs text-ghana-muted">{summary.length} / 5000 characters</p>
              {summaryTooShort ? (
                <p className="mt-2 text-xs text-ghana-red">Summary must be at least 50 characters.</p>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-ghana-red/30 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">
                {errorMessage}
              </p>
            ) : null}
          </CardBody>
          <CardFooter className="flex items-center justify-between">
            <p className="text-xs text-ghana-muted">
              Your proposal starts in &ldquo;proposed&rdquo; and moves to &ldquo;gathering signatures&rdquo;
              after moderator review.
            </p>
            <Button type="submit" disabled={createBill.isPending}>
              {createBill.isPending ? 'Submitting…' : 'Submit proposal'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  )
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
