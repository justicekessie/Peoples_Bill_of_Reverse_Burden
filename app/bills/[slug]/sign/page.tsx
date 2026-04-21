'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { useBill, useSignBill, useVerifySignature } from '@/hooks/useBills'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Label,
  Select,
} from '@/components/ui'
import type { BillSignInput } from '@/lib/api'

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Oti',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
]

export default function SignBillPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? ''
  const { data: bill } = useBill(slug)

  const signBill = useSignBill(slug)
  const verifySignature = useVerifySignature(slug)

  const [identifier, setIdentifier] = useState('')
  const [identifierType, setIdentifierType] = useState<BillSignInput['identifier_type']>('phone')
  const [region, setRegion] = useState<string>('')
  const [signatureId, setSignatureId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  async function handleSign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    try {
      const response = await signBill.mutateAsync({
        identifier,
        identifier_type: identifierType,
        region: region || undefined,
      })
      setSignatureId(response.signature_id)
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err))
    }
  }

  async function handleVerify() {
    if (signatureId == null) return
    setErrorMessage(null)
    try {
      await verifySignature.mutateAsync(signatureId)
      setVerified(true)
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err))
    }
  }

  if (bill && bill.stage !== 'gathering_signatures') {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-ghana-red">
          This bill is not currently collecting signatures.
        </p>
        <Link
          href={`/bills/${slug}`}
          className="mt-4 inline-block text-ghana-green underline"
        >
          ← Back to the bill
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/bills/${slug}`} className="text-sm text-ghana-muted hover:text-ghana-green">
        ← Back to the bill
      </Link>

      <h1 className="mt-4 font-serif text-3xl font-bold text-ghana-dark">
        Sign {bill ? `“${bill.title}”` : 'this bill'}
      </h1>
      <p className="mt-3 text-sm text-ghana-muted">
        Your identifier is hashed before it is stored, and only verified signatures count
        toward the threshold.
      </p>

      {signatureId == null ? (
        <form onSubmit={handleSign} className="mt-8">
          <Card>
            <CardBody className="space-y-6">
              <div>
                <Label htmlFor="identifier-type">I&rsquo;m signing with my</Label>
                <Select
                  id="identifier-type"
                  value={identifierType}
                  onChange={(e) =>
                    setIdentifierType(e.target.value as BillSignInput['identifier_type'])
                  }
                >
                  <option value="phone">Phone number</option>
                  <option value="email">Email address</option>
                  <option value="national_id">National ID</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="identifier">
                  {identifierType === 'phone'
                    ? 'Phone number'
                    : identifierType === 'email'
                      ? 'Email address'
                      : 'National ID'}
                </Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="region">Region (optional)</Label>
                <Select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-ghana-red/30 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">
                  {errorMessage}
                </p>
              ) : null}
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={signBill.isPending}>
                {signBill.isPending ? 'Submitting…' : 'Continue'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold text-ghana-dark">
              {verified ? 'Signature verified' : 'Verify your signature'}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {verified ? (
              <p className="text-sm text-ghana-muted">
                Thank you — your signature now counts toward the {bill?.signature_threshold ?? 100}
                -signature threshold.
              </p>
            ) : (
              <>
                <p className="text-sm text-ghana-muted">
                  We&rsquo;d normally send a one-time code to your {identifierType.replace('_', ' ')}.
                  OTP delivery is not yet wired up, so this button just marks the signature as
                  verified for now.
                </p>
                {errorMessage ? (
                  <p className="rounded-md border border-ghana-red/30 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">
                    {errorMessage}
                  </p>
                ) : null}
              </>
            )}
          </CardBody>
          <CardFooter className="flex justify-end gap-3">
            {verified ? (
              <Link href={`/bills/${slug}`}>
                <Button>Back to the bill</Button>
              </Link>
            ) : (
              <Button onClick={handleVerify} disabled={verifySignature.isPending}>
                {verifySignature.isPending ? 'Verifying…' : 'Verify signature'}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
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
