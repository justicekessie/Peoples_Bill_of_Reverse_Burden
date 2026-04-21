import Link from 'next/link'
import { ChevronRight, Menu, Shield } from 'lucide-react'
import { cn } from '../lib/utils'
import { publicNav, secureNav } from '../lib/design-system'
import { Button } from './ui'

export function GhanaFlag() {
  return (
    <div className="flex gap-[2px]">
      <span className="h-8 w-1 rounded-[1px] bg-ghana-red" />
      <span className="h-8 w-1 rounded-[1px] bg-ghana-gold" />
      <span className="h-8 w-1 rounded-[1px] bg-ghana-green" />
    </div>
  )
}

export function PageStripe() {
  return <div className="fixed inset-x-0 top-0 z-[60] h-[5px] kente-stripe" />
}

export function SiteHeader() {
  return (
    <header className="sticky top-[5px] z-50 border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 pr-2">
            <div className="flex gap-[2px]">
              <span className="h-8 w-[3px] rounded-[1px] bg-ghana-red" />
              <span className="h-8 w-[3px] rounded-[1px] bg-ghana-gold" />
              <span className="h-8 w-[3px] rounded-[1px] bg-ghana-green" />
            </div>
            <div>
              <div className="font-serif text-[33px] font-semibold leading-none text-ghana-dark">People's Bill</div>
              <div className="pt-[2px] text-[10px] font-medium uppercase tracking-[0.24em] text-ghana-muted">Reverse Burden Act</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-ghana-muted transition-colors hover:bg-ghana-cream hover:text-ghana-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-3 pr-1">
          <span className="hidden h-10 items-center rounded-full border border-[#95cdb5] bg-[#d6e7df] px-4 text-[27px] font-semibold text-ghana-green md:inline-flex">
            Ghana 2025
          </span>
          <Button variant="outline" size="sm" className="hidden h-10 rounded-xl border-[#cbcfcb] bg-[#f4f4f4] px-5 text-[27px] font-semibold text-[#2f3a35] hover:bg-[#ececec] sm:inline-flex">
            English
          </Button>
          <Button variant="primary" size="sm" className="hidden h-10 rounded-xl bg-ghana-green px-5 text-[27px] font-semibold text-white hover:bg-ghana-dark sm:inline-flex">
            Submit Input
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-ghana-ink transition-colors hover:bg-ghana-cream md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ghana-dark bg-ghana-dark text-white">
      <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <GhanaFlag />
              <div className="font-serif text-xl font-bold">People's Bill</div>
            </div>
            <p className="max-w-sm text-sm leading-7 text-white/45">
              Empowering Ghanaians to shape legislation through a disciplined, transparent civic workflow.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Platform</h3>
            <div className="space-y-3 text-sm text-white/55">
              <Link href="/" className="block transition-colors hover:text-white">Home</Link>
              <Link href="/submit" className="block transition-colors hover:text-white">Submit Input</Link>
              <Link href="/bill" className="block transition-colors hover:text-white">The Bill</Link>
              <Link href="/stats" className="block transition-colors hover:text-white">Statistics</Link>
              <Link href="/admin" className="block transition-colors hover:text-white">Admin</Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Status</h3>
            <div className="space-y-3 text-sm text-white/55">
              <div>Public review</div>
              <div>Draft publication</div>
              <div>Legislative export</div>
              <div>Accessibility first</div>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Contact</h3>
            <div className="space-y-3 text-sm text-white/55">
              <div>info@peoplesbill.gh</div>
              <div>Accra, Ghana</div>
              <div>+233 XX XXX XXXX</div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
          <p>© 2025 People's Bill Platform. Built for Ghana's democratic future.</p>
          <div className="flex gap-5">
            <a href="/privacy" className="transition-colors hover:text-white">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-white">Terms</a>
            <a href="/open-source" className="transition-colors hover:text-white">Open Source</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ghana-cream text-ghana-ink">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}

export function DashboardShell({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-ghana-cream text-ghana-ink">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-ghana-dark bg-ghana-dark text-white lg:block">
          <div className="sticky top-[5px] flex min-h-screen flex-col">
            <div className="border-b border-white/10 px-5 py-6">
              <div className="mb-4 flex items-center gap-3">
                <GhanaFlag />
                <div>
                  <div className="font-serif text-lg font-bold">People's Bill</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/35">Platform</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Shield className="h-4 w-4" />
                Civic workspace
              </div>
            </div>
            <nav className="flex-1 px-3 py-4">
              {secureNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'mb-1 flex items-center justify-between rounded-none px-4 py-3 text-sm transition-colors',
                    item.label === 'Dashboard'
                      ? 'border-l-4 border-ghana-green bg-ghana-green/35 text-white'
                      : 'text-white/55 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 px-5 py-5 text-xs text-white/35">Ready for publication</div>
          </div>
        </aside>

        <div>
          <div className="sticky top-[5px] z-40 border-b border-border/80 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[calc(1120px+64px)] items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ghana-green">{title}</p>
                <h1 className="font-serif text-lg font-bold text-ghana-dark">{description}</h1>
              </div>
              <div className="flex items-center gap-3">{action}</div>
            </div>
          </div>
          <main className="mx-auto max-w-[calc(1120px+64px)] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ghana-cream text-ghana-ink">
      <header className="sticky top-[5px] z-40 border-b border-border/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <GhanaFlag />
            <div>
              <div className="font-serif text-lg font-bold text-ghana-dark">People's Bill</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-ghana-muted">Secure Access</div>
            </div>
          </Link>
          <Link href="/" className="text-sm font-medium text-ghana-muted transition-colors hover:text-ghana-ink">
            Back home
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
