'use client'

import { useEffect, useState } from 'react'
import { ClauseEditorPanel } from '@/components/templates'
import { DashboardShell, AuthShell } from '@/components/layout'
import { Badge, Button, Card, CardBody, Input, Label } from '@/components/ui'
import { adminLogin, isAuthenticated } from '@/lib/api'

function EditorGate({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSigningIn(true)
    setError('')
    try {
      await adminLogin(username, password)
      onSignedIn()
    } catch {
      setError('Invalid credentials. Use the admin account configured on the backend.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <AuthShell>
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1120px] items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <Card className="w-full max-w-[320px] shadow-[0_24px_60px_rgba(8,26,16,0.08)]">
          <CardBody className="px-8 py-10 text-center">
            <h1 className="font-serif text-[28px] font-bold leading-[1.08] text-ghana-dark">
              Editor access
            </h1>
            <p className="mt-2 text-sm text-ghana-muted">Sign in to edit bill clauses.</p>
            <form className="mt-8 space-y-5 text-left" onSubmit={handleSignIn}>
              <div>
                <Label htmlFor="editor-username">Username</Label>
                <Input
                  id="editor-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="editor-password">Password</Label>
                <Input
                  id="editor-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2"
                />
              </div>
              {error ? (
                <div className="rounded-xl border border-ghana-red/20 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">
                  {error}
                </div>
              ) : null}
              <Button className="w-full" type="submit" disabled={isSigningIn}>
                {isSigningIn ? 'Signing in' : 'Sign in'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </section>
    </AuthShell>
  )
}

export default function AdminEditorPage() {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_ADMIN_AUTH === 'true'
  const [signedIn, setSignedIn] = useState(bypassAuth)
  const [checkedSession, setCheckedSession] = useState(bypassAuth)

  useEffect(() => {
    if (bypassAuth) return
    setSignedIn(isAuthenticated())
    setCheckedSession(true)
  }, [bypassAuth])

  if (!checkedSession) return null
  if (!signedIn) return <EditorGate onSignedIn={() => setSignedIn(true)} />

  return (
    <DashboardShell
      title="Editor"
      description="Clause drafting workspace"
      action={<Badge tone="green">Signed in</Badge>}
    >
      <ClauseEditorPanel billSlug="reverse-burden" />
    </DashboardShell>
  )
}
