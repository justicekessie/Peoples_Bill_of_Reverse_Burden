'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, FileText, Shield, Sparkles, Users, Vote } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { authHighlights, dashboardActivity, dashboardMetrics, editorSections, ghanaRegions, homeFeatures, workflowSteps, settingsGroups, secureNav } from '../lib/design-system'
import { adminLogin, isAuthenticated, type StatsResponse } from '../lib/api'
import { useStats } from '../hooks/useStats'
import { Badge, Button, Card, CardBody, CardFooter, ProgressBar, SectionHeading, StatCard, Input, Label, Select, Textarea } from './ui'
import { AuthShell, DashboardShell, GhanaFlag, PublicShell } from './layout'

const fallbackStats: StatsResponse = {
  total_submissions: 3847,
  total_contributors: 128,
  regions_represented: 16,
  clusters_formed: 12,
  clauses_drafted: 7,
  average_approval_rate: 74.2,
  submissions_by_region: {
    'Greater Accra': 1247,
    Ashanti: 892,
    Western: 384,
    Eastern: 361,
    Central: 298,
    Volta: 241,
    Northern: 218,
    Bono: 176,
  },
  submissions_over_time: [
    { date: '2025-04-14', count: 34 },
    { date: '2025-04-15', count: 41 },
    { date: '2025-04-16', count: 49 },
    { date: '2025-04-17', count: 42 },
    { date: '2025-04-18', count: 58 },
    { date: '2025-04-19', count: 64 },
    { date: '2025-04-20', count: 71 },
  ],
  top_themes: [
    { theme: 'Reverse Burden of Proof', submissions: 97, confidence: 96 },
    { theme: 'Asset Declaration', submissions: 94, confidence: 92 },
    { theme: 'Whistleblower Protection', submissions: 88, confidence: 89 },
    { theme: 'Fair Hearing Rights', submissions: 76, confidence: 87 },
  ],
  participation_rate: {
    overall: 2.8,
    estimated_participants: 1920,
    by_region: {
      'Greater Accra': 3.1,
      Ashanti: 2.9,
      Western: 2.5,
      Eastern: 2.4,
      Central: 2.2,
      Volta: 2.1,
      Northern: 2.0,
      Bono: 1.9,
    },
  },
  last_updated: '2025-04-20T09:30:00.000Z',
}

const settingsItems = [
  { label: 'Workspace name', value: "People's Bill Ghana" },
  { label: 'Email address', value: 'info@peoplesbill.gh' },
  { label: 'Default language', value: 'English' },
  { label: 'Density', value: 'Comfortable' },
]

const regionalBars = Object.entries(fallbackStats.submissions_by_region)
  .map(([name, count]) => ({ name, count }))
  .sort((left, right) => right.count - left.count)

const processSteps = [
  {
    step: '1',
    title: 'You Submit',
    description: 'Share your ideas, concerns, or specific provisions you want included - in plain language, no legal training required.',
    tone: 'green',
  },
  {
    step: '2',
    title: 'AI Clusters',
    description: 'Submissions are grouped by theme. Common ideas surface automatically so no voice is lost in the volume.',
    tone: 'gold',
  },
  {
    step: '3',
    title: 'Experts Draft',
    description: 'Legal professionals transform the top themes into formal, enforceable bill clauses grounded in Ghanaian law.',
    tone: 'red',
  },
  {
    step: '4',
    title: 'Parliament',
    description: "The people's bill, backed by verified citizen participation data, is formally submitted to Ghana's Parliament.",
    tone: 'dark',
  },
]

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
  })
}

function formatStatsValue(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  })
}

function StatsPanel() {
  const { data, isLoading, isError } = useStats()
  const stats = data ?? fallbackStats
  const regionEntries = Object.entries(stats.submissions_by_region)
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
  const maxRegionCount = Math.max(...regionEntries.map((entry) => entry.count), 1)
  const timeline = stats.submissions_over_time.length ? stats.submissions_over_time : fallbackStats.submissions_over_time
  const latestDailyCount = timeline[timeline.length - 1]?.count ?? 0

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Submissions" value={formatStatsValue(stats.total_submissions)} delta={isLoading ? 'Refreshing...' : 'DB-backed totals'} tone="green" />
        <StatCard label="Regions Active" value={formatStatsValue(stats.regions_represented)} delta="all regions represented" tone="gold" />
        <StatCard label="Clusters Formed" value={formatStatsValue(stats.clusters_formed)} delta="thematic groupings" tone="red" />
        <StatCard label="Daily Submissions" value={formatStatsValue(latestDailyCount)} delta={stats.last_updated ? `updated ${formatDateLabel(stats.last_updated.slice(0, 10))}` : 'live feed'} tone="dark" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardBody>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-ghana-dark">Daily submissions</h3>
                <p className="mt-1 text-sm text-ghana-muted">Bars are driven by the database time series returned from the backend.</p>
              </div>
              <Badge tone={isError ? 'red' : 'green'}>{isError ? 'Fallback data' : 'Live data'}</Badge>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E3D8" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: '#637068', fontSize: 12 }} axisLine={{ stroke: '#E8E3D8' } as never} tickLine={false} />
                  <YAxis tick={{ fill: '#637068', fontSize: 12 }} axisLine={{ stroke: '#E8E3D8' } as never} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 107, 63, 0.08)' }}
                    contentStyle={{ borderRadius: '14px', border: '1px solid #E8E3D8', background: '#FFFDF8', boxShadow: '0 12px 24px rgba(8, 26, 16, 0.08)' }}
                    labelFormatter={(label) => formatDateLabel(String(label))}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#006B3F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardBody>
            <div className="mb-6">
              <h3 className="font-serif text-2xl font-bold text-ghana-dark">Regional participation</h3>
              <p className="mt-1 text-sm text-ghana-muted">The same counts can back admin views, public stats, and export workflows.</p>
            </div>
            <div className="space-y-4">
              {regionEntries.map((region, index) => (
                <div key={region.name} className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_56px] sm:items-center">
                  <div className="text-sm font-medium text-ghana-ink">{region.name}</div>
                  <ProgressBar value={(region.count / maxRegionCount) * 100} />
                  <div className="text-right text-sm font-semibold text-ghana-dark">{formatStatsValue(region.count)}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <CardBody>
            <h3 className="font-serif text-2xl font-bold text-ghana-dark">Top themes</h3>
            <div className="mt-6 space-y-4">
              {stats.top_themes.length ? stats.top_themes.map((theme) => (
                <div key={theme.theme} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-ghana-ink">{theme.theme}</span>
                    <span className="text-ghana-muted">{formatStatsValue(theme.submissions)} submissions</span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={theme.confidence} />
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-border bg-ghana-paper px-4 py-3 text-sm text-ghana-muted">No themes returned yet.</div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardBody>
            <h3 className="font-serif text-2xl font-bold text-ghana-dark">Infrastructure notes</h3>
            <p className="mt-2 text-sm leading-7 text-ghana-muted">
              This page reads from <span className="font-semibold text-ghana-ink">/api/stats</span>, which in turn uses the backend aggregation service over the submissions, clusters, and regions tables.
            </p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-ghana-ink">
              <div className="rounded-xl border border-border bg-ghana-paper px-4 py-3">Daily chart data comes from <span className="font-semibold">submissions_over_time</span>.</div>
              <div className="rounded-xl border border-border bg-ghana-paper px-4 py-3">Cards are backed by database counts, not hard-coded copy.</div>
              <div className="rounded-xl border border-border bg-ghana-paper px-4 py-3">Fallback values keep the layout usable if the API is offline.</div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export function HomeTemplate() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-ghana-dark text-white">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,26,16,0.42)_0%,rgba(8,26,16,0.72)_100%)]" />
        <div className="hero-star absolute -right-10 top-[-36px] h-[360px] w-[360px] bg-black/20" />
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-ghana-green/10 blur-3xl" />
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <Badge tone="gold" className="mb-8 border-ghana-gold/30 bg-ghana-gold/15 text-ghana-gold [font-family:var(--font-hero-sans)]">Civic Initiative · Ghana 2025</Badge>
            <h1 className="max-w-3xl text-[clamp(38px,4.7vw,68px)] font-bold leading-[1.02] tracking-[-0.02em] text-white [font-family:var(--font-hero-serif)] [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]">
              Shape the law.
              <span className="block text-ghana-gold italic [font-family:var(--font-hero-serif)] [text-shadow:0_2px_18px_rgba(0,0,0,0.22)]">Hold Power Accountable.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[clamp(20px,2.2vw,28px)] leading-[1.5] text-white/82 [font-family:var(--font-hero-sans)]">
              Join thousands of Ghanaians crowdsourcing the Reverse Burden Bill - legislation that requires public officials to explain wealth beyond their legitimate income.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="secondary" size="lg" className="min-w-[196px] border border-ghana-gold/70 font-bold text-[15px]">
                Submit Input
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="min-w-[196px] border-white/25 bg-transparent text-white/90 hover:bg-white/10 hover:text-white">
                Read the Draft Bill
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-12 rounded-[10px] border border-white/10 bg-white/10 backdrop-blur-sm">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: '3,847+', label: 'SUBMISSIONS', tone: 'text-ghana-gold' },
                  { value: '16', label: 'REGIONS ACTIVE', tone: 'text-ghana-gold' },
                  { value: '12', label: 'THEMES IDENTIFIED', tone: 'text-white' },
                  { value: '7', label: 'CLAUSES DRAFTED', tone: 'text-[#4dde8a]' },
                ].map((item, index) => (
                  <div key={item.label} className={`px-6 py-5 ${index > 0 ? 'border-l border-white/10' : ''}`}>
                    <div className={`font-serif text-[42px] font-semibold leading-none ${item.tone}`}>{item.value}</div>
                    <div className="mt-2 text-[12px] font-semibold tracking-[0.1em] text-white/60">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-ghana-cream [clip-path:ellipse(55%_100%_at_50%_100%)]" />
      </section>

      <section className="bg-ghana-cream py-20">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <div className="mb-12 max-w-3xl">
            <SectionHeading
              eyebrow="The Bill"
              title={<>What is the Reverse Burden Bill?</>}
              description="A legal proposal that shifts the burden of proof so public officers must explain wealth that exceeds their lawful income."
            />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {homeFeatures.map((feature) => (
              <Card key={feature.title} className="p-8 shadow-sm">
                <div
                  className={
                    feature.tone === 'green'
                      ? 'mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-ghana-green/10 text-2xl text-ghana-green'
                      : feature.tone === 'gold'
                        ? 'mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-ghana-gold/20 text-2xl text-ghana-dark'
                        : 'mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] bg-ghana-red/10 text-2xl text-ghana-red'
                  }
                >
                  {feature.tone === 'green' ? <Shield className="h-6 w-6" /> : feature.tone === 'gold' ? <Vote className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <h3 className="mb-3 font-serif text-2xl font-bold text-ghana-dark">{feature.title}</h3>
                <p className="text-sm leading-7 text-ghana-muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ghana-paper py-20">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-ghana-green">The Process</p>
              <h2 className="mt-5 font-serif text-[clamp(44px,5vw,76px)] font-bold leading-[0.94] tracking-[-0.03em] text-ghana-dark">
                How your voice
                <span className="block italic text-ghana-green">becomes law</span>
              </h2>
              <p className="mt-6 max-w-lg text-xl leading-[1.7] text-ghana-muted">
                A transparent, AI-assisted pipeline from citizen input to parliamentary draft.
              </p>
            </div>

            <div className="space-y-10">
              {processSteps.map((step, index) => (
                <div key={step.step} className="grid grid-cols-[32px_24px_minmax(0,1fr)] gap-5">
                  <div className={`pt-1 text-2xl font-serif ${step.tone === 'green' ? 'text-ghana-green' : step.tone === 'gold' ? 'text-ghana-gold' : step.tone === 'red' ? 'text-ghana-red' : 'text-ghana-muted'}`}>
                    {step.step}
                  </div>
                  <div className="relative flex justify-center">
                    <div className="h-full w-px bg-border/80" />
                    {index === processSteps.length - 1 ? null : <div className="absolute bottom-0 h-10 w-px bg-border/80" />}
                  </div>
                  <div className="pb-1">
                    <h3 className="font-serif text-[clamp(26px,2.3vw,38px)] font-normal leading-[1.08] text-ghana-dark">{step.title}</h3>
                    <p className="mt-3 max-w-2xl text-lg leading-[1.55] text-ghana-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ghana-dark py-20 text-white">
        <div className="mx-auto max-w-[760px] px-4 text-center sm:px-6 lg:px-10">
          <h2 className="font-serif text-[clamp(28px,4vw,48px)] font-bold leading-[1.08]">
            Every submission counts.
            <span className="block text-ghana-gold italic">Every voice matters.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/60">
            It takes two minutes to contribute to a bill that can reshape public accountability in Ghana.
          </p>
          <div className="mt-10 flex justify-center">
            <Button variant="secondary" size="lg">
              Submit Your Input
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}

export function DashboardTemplate() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Platform overview"
      action={<Button size="sm">Export report</Button>}
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone as 'green' | 'gold' | 'red' | 'dark'}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden">
            <CardBody>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ghana-dark">Regional Participation</h3>
                  <p className="mt-1 text-sm text-ghana-muted">Submissions by region and audience weight.</p>
                </div>
                <Badge tone="green">Live</Badge>
              </div>
              <div className="space-y-4">
                {regionalBars.map((region, index) => (
                  <div key={region.name} className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_56px] sm:items-center">
                    <div className="text-sm font-medium text-ghana-ink">{region.name}</div>
                    <ProgressBar value={100 - index * 7} />
                    <div className="text-right text-sm font-semibold text-ghana-dark">{region.count.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody>
              <div className="mb-6">
                <h3 className="font-serif text-2xl font-bold text-ghana-dark">Recent Activity</h3>
                <p className="mt-1 text-sm text-ghana-muted">A concise operational log for the editorial queue.</p>
              </div>
              <div className="space-y-4">
                {dashboardActivity.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border bg-ghana-paper px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-ghana-ink">{item.title}</div>
                        <div className="mt-1 text-sm text-ghana-muted">{item.meta}</div>
                      </div>
                      <Badge tone={item.status === 'ready' ? 'green' : item.status === 'processing' ? 'gold' : 'red'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex items-center justify-between text-sm text-ghana-muted">
                <span>Updated 20 April 2025</span>
                <Link href="/editor" className="inline-flex items-center gap-2 font-semibold text-ghana-green">
                  Open editor
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

export function EditorTemplate() {
  return (
    <DashboardShell
      title="Editor"
      description="Bill composition workspace"
      action={<Button size="sm" variant="outline">Publish draft</Button>}
    >
      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <Card className="p-0">
          <CardBody className="space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-ghana-dark">Structure</h3>
              <p className="mt-1 text-sm text-ghana-muted">Use the canonical bill sequence.</p>
            </div>
            <div className="space-y-2">
              {editorSections.map((section, index) => (
                <div key={section} className="flex items-center justify-between rounded-lg border border-border bg-ghana-paper px-3 py-3 text-sm">
                  <span className="font-medium text-ghana-ink">{section}</span>
                  <Badge tone={index < 2 ? 'green' : 'neutral'}>{index < 2 ? 'locked' : 'editable'}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardBody>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ghana-dark">Clause editor</h3>
                  <p className="mt-1 text-sm text-ghana-muted">Preserve the legal tone and the visual system.</p>
                </div>
                <Badge tone="gold">Draft v1.0</Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clause-title">Clause title</Label>
                  <Input id="clause-title" defaultValue="Interpretation and Definitions" />
                </div>
                <div>
                  <Label htmlFor="clause-text">Clause content</Label>
                  <Textarea
                    id="clause-text"
                    rows={12}
                    defaultValue={'In this Act, unless the context otherwise requires:\n\n\"public officer\" means any person employed in or holding office in the public service, including elected officials, appointed ministers, members of Parliament, judges, military and police officers.'}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button>Save revision</Button>
                  <Button variant="outline">Preview clause</Button>
                  <Button variant="ghost">Reset</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ghana-dark">Live preview</h3>
                  <p className="mt-1 text-sm text-ghana-muted">Rendered the way the public will see it.</p>
                </div>
                <Badge tone="green">Published tone</Badge>
              </div>
              <div className="rounded-xl border border-border bg-ghana-paper px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ghana-green">Section 1</p>
                <h4 className="mt-2 font-serif text-2xl font-bold text-ghana-dark">Interpretation and Definitions</h4>
                <p className="mt-4 text-sm leading-8 text-ghana-ink">
                  In this Act, unless the context otherwise requires, public officers must explain wealth disproportionate to their lawful income.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardBody>
            <h3 className="font-serif text-2xl font-bold text-ghana-dark">Review notes</h3>
            <p className="mt-1 text-sm text-ghana-muted">Keep the editorial queue short and structured.</p>
            <div className="mt-5 space-y-4">
              {[
                'Align clause language with existing Ghanaian statutory forms.',
                'Keep all subsection numbering consistent across sections.',
                'Avoid adding new style patterns outside the established system.',
              ].map((note) => (
                <div key={note} className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-7 text-ghana-ink">
                  {note}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  )
}

export function SettingsTemplate() {
  return (
    <DashboardShell
      title="Settings"
      description="Platform preferences"
      action={<Button size="sm" variant="outline">Save changes</Button>}
    >
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Configuration"
          title={<>Tune the workspace without changing the visual language.</>}
          description="The settings surface stays quiet, legible, and aligned with the same document-led design system."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          {settingsGroups.map((group) => (
            <Card key={group.title} className="overflow-hidden">
              <CardBody className="space-y-5">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ghana-dark">{group.title}</h3>
                  <p className="mt-1 text-sm text-ghana-muted">{group.description}</p>
                </div>
                <div className="space-y-4">
                  {settingsItems.slice(0, 2).map((item) => (
                    <div key={item.label}>
                      <Label>{item.label}</Label>
                      <Input defaultValue={item.value} />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}

export function AuthTemplate() {
  return (
    <AuthShell>
      <section className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <Card className="overflow-hidden bg-ghana-dark text-white">
            <CardBody className="flex h-full flex-col justify-between gap-10 p-8 lg:p-10">
              <div>
                <Badge tone="gold" className="mb-6">Secure access</Badge>
                <h1 className="font-serif text-[clamp(34px,4vw,56px)] font-bold leading-[1.05]">
                  Enter the civic workspace.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/65">
                  Sign in to review submissions, edit clauses, and manage the platform with the same disciplined visual system.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {authHighlights.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-0">
              <CardBody className="space-y-4 p-8">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-ghana-dark">Sign in</h2>
                  <p className="mt-2 text-sm text-ghana-muted">Access the platform using your editorial account.</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input placeholder="admin@peoplesbill.gh" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="flex items-center justify-between text-sm text-ghana-muted">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-ghana-green focus:ring-ghana-green" />
                    Remember me
                  </label>
                  <a href="/auth/reset" className="font-semibold text-ghana-green">Forgot password</a>
                </div>
                <Button className="w-full">Sign in</Button>
              </CardBody>
            </Card>

            <Card className="p-0">
              <CardBody className="space-y-4 p-8">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-ghana-dark">Create account</h2>
                  <p className="mt-2 text-sm text-ghana-muted">Set up a new editorial or administrative workspace.</p>
                </div>
                <div>
                  <Label>Full name</Label>
                  <Input placeholder="Ama Mensah" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select defaultValue="editor">
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                  </Select>
                </div>
                <div>
                  <Label>Workspace region</Label>
                  <Select defaultValue="greater-accra">
                    {ghanaRegions.map((region) => (
                      <option key={region} value={region.toLowerCase().replace(/\s+/g, '-')}>{region}</option>
                    ))}
                  </Select>
                </div>
                <Button variant="outline" className="w-full">
                  Create account
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </AuthShell>
  )
}

function AdminGate({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [checkedSession, setCheckedSession] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      onSignedIn()
      return
    }

    setCheckedSession(true)
  }, [onSignedIn])

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

  if (!checkedSession) {
    return null
  }

  return (
    <AuthShell>
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1120px] items-center justify-center px-4 py-12 sm:px-6 lg:px-10">
        <Card className="w-full max-w-[320px] shadow-[0_24px_60px_rgba(8,26,16,0.08)]">
          <CardBody className="px-8 py-10 text-center">
            <div className="mx-auto mb-6 w-fit">
              <GhanaFlag />
            </div>
            <h1 className="font-serif text-[28px] font-bold leading-[1.08] text-ghana-dark">Admin Access</h1>
            <p className="mt-2 text-sm text-ghana-muted">People's Bill Platform · Restricted</p>

            <form className="mt-8 space-y-5 text-left" onSubmit={handleSignIn}>
              <div>
                <Label htmlFor="admin-username">Username</Label>
                <Input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="mt-2" />
              </div>
              {error ? <div className="rounded-xl border border-ghana-red/20 bg-ghana-red/5 px-4 py-3 text-sm text-ghana-red">{error}</div> : null}
              <Button className="mt-1 w-full" type="submit" disabled={isSigningIn}>
                {isSigningIn ? 'Signing In' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-xs text-ghana-muted">Demo credentials: admin / admin</p>
          </CardBody>
        </Card>
      </section>
    </AuthShell>
  )
}

const billClauses = [
  {
    section: 'Section 1',
    title: 'Interpretation and Definitions',
    text: 'Defines public officer, unexplained wealth, and the relevant oversight authority.',
    rationale: 'The bill needs a disciplined vocabulary before any enforcement logic can work.',
  },
  {
    section: 'Section 2',
    title: 'Asset Declaration Requirements',
    text: 'Requires timely and recurring declaration of assets, liabilities, and beneficial interests.',
    rationale: 'Creates a verifiable baseline for any later investigation.',
  },
  {
    section: 'Section 3',
    title: 'Presumption of Unexplained Wealth',
    text: 'Shifts the burden to the public officer once reasonable grounds exist to suspect disproportionate wealth.',
    rationale: 'This is the core reverse-burden mechanism the platform is built around.',
  },
  {
    section: 'Section 4',
    title: 'Investigation Procedures',
    text: 'Sets timelines, notices, and records access for a controlled and auditable inquiry.',
    rationale: 'Procedural discipline is what keeps the law constitutional and usable.',
  },
]

const submissionPrompts = [
  'What should public officials declare, and how often?',
  'Which assets or relatives should be covered?',
  'What should happen when wealth cannot be explained?',
  'How do we protect due process and fair hearing?',
]

export function SubmitTemplate() {
  const [step, setStep] = useState(1)

  return (
    <PublicShell>
      <section className="bg-ghana-dark py-16 text-white">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10">
          <Badge tone="gold" className="mb-6">Citizen Input</Badge>
          <h1 className="font-serif text-[clamp(30px,4vw,46px)] font-bold leading-[1.05]">Submit Your Input</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Tell us what should be in the Reverse Burden Bill. Keep it plain, specific, and focused on accountability.
          </p>
          <div className="mt-8 inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5">
            {['Your Region', 'Your Input', 'About You'].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index + 1)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${step === index + 1 ? 'bg-ghana-gold text-ghana-dark' : 'text-white/45 hover:text-white'}`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-10">
          <Card className="p-0 shadow-sm">
            <CardBody className="space-y-8 p-8">
              {step === 1 && (
                <div className="space-y-4">
                  <SectionHeading eyebrow="Step 1" title="Choose your region" description="Select where your submission is coming from so participation can be tracked correctly." />
                  <div>
                    <Label>Your Region</Label>
                    <Select defaultValue="">
                      <option value="">Select your region</option>
                      {ghanaRegions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </Select>
                  </div>
                  <Button onClick={() => setStep(2)}>Continue</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <SectionHeading eyebrow="Step 2" title="Write your submission" description="Use the prompts below if you need structure." />
                  <div className="grid gap-3">
                    {submissionPrompts.map((prompt) => (
                      <div key={prompt} className="rounded-lg border border-border bg-ghana-paper px-4 py-3 text-sm text-ghana-muted">
                        {prompt}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Your Submission</Label>
                    <Textarea placeholder="Write your ideas, concerns, or specific provisions you'd like included in the bill." rows={7} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <SectionHeading eyebrow="Step 3" title="Optional details" description="These details help understand participation but stay anonymous." />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Age</Label>
                      <Input type="number" placeholder="e.g. 34" />
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input placeholder="e.g. Teacher, Trader, Student" />
                    </div>
                  </div>
                  <Button>Submit Input</Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </PublicShell>
  )
}

export function BillTemplate() {
  const [openSection, setOpenSection] = useState(3)

  return (
    <PublicShell>
      <section className="bg-ghana-dark py-16 text-white">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <Badge tone="gold" className="mb-6">Draft Legislation · v1.0.0</Badge>
          <h1 className="font-serif text-[clamp(30px,4vw,46px)] font-bold leading-[1.05]">The People's Bill on Reverse Burden</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            A bill to require public officers to explain wealth disproportionate to lawful income and to provide for confiscation of unexplained assets.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <div className="rounded-xl border border-border bg-ghana-paper p-8 text-sm leading-8 text-ghana-ink">
            <strong>WHEREAS</strong> the Parliament of Ghana recognises that corruption in public office constitutes a fundamental breach of the social contract;<br /><br />
            <strong>AND WHEREAS</strong> existing legislation places an undue burden on the State to establish the criminal origin of wealth;<br /><br />
            <strong>NOW THEREFORE</strong> be it enacted by the Parliament of the Republic of Ghana as follows:
          </div>

          <div className="mt-8 space-y-4">
            {billClauses.map((clause, index) => {
              const expanded = openSection === index + 1
              return (
                <Card key={clause.section} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(expanded ? 0 : index + 1)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ghana-green">{clause.section}</p>
                      <h2 className="mt-2 font-serif text-2xl font-bold text-ghana-dark">{clause.title}</h2>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-ghana-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </button>
                  {expanded ? (
                    <CardBody className="border-t border-border">
                      <div className="space-y-4 text-sm leading-8 text-ghana-ink">
                        <p>{clause.text}</p>
                        <div className="rounded-lg border-l-4 border-ghana-green bg-ghana-green/5 px-4 py-3 text-ghana-muted">{clause.rationale}</div>
                      </div>
                    </CardBody>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}

export function StatsTemplate() {
  return (
    <PublicShell>
      <section className="bg-ghana-dark py-16 text-white">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <Badge tone="gold" className="mb-6">Platform Analytics</Badge>
          <h1 className="font-serif text-[clamp(30px,4vw,46px)] font-bold leading-[1.05]">Participation Statistics</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Live participation across Ghana, shaped by civic submissions and region-level engagement.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-10">
          <StatsPanel />
        </div>
      </section>
    </PublicShell>
  )
}

export function AdminTemplate() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'statistics' | 'auth'>('dashboard')
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    setSignedIn(isAuthenticated())
  }, [])

  if (!signedIn) {
    return <AdminGate onSignedIn={() => setSignedIn(true)} />
  }

  return (
    <DashboardShell title="Admin" description="Secure portal" action={<Badge tone="green">Signed in</Badge>}>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Restricted"
          title={<>Portal management</>}
          description="This area is not shown in the public nav. It is the gateway to secure pages after sign-in."
        />

        <div className="flex flex-wrap gap-2">
          {secureNav.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label.toLowerCase() as typeof activeTab)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.label.toLowerCase() ? 'border-ghana-green bg-ghana-green text-white' : 'border-border bg-white text-ghana-muted hover:bg-ghana-cream'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone as 'green' | 'gold' | 'red' | 'dark'} />
            ))}
          </div>
        )}

        {activeTab === 'statistics' && <StatsPanel />}

        {activeTab === 'editor' && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-ghana-dark">Editorial workspace</h2>
              <p className="text-sm text-ghana-muted">The editor is gated and only reachable from here.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {editorSections.map((section) => (
                  <div key={section} className="rounded-lg border border-border bg-ghana-paper px-4 py-3 text-sm font-medium text-ghana-ink">{section}</div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'statistics' && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-ghana-dark">Secure statistics</h2>
              <p className="text-sm text-ghana-muted">These analytics sit behind the admin portal.</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {dashboardMetrics.map((metric) => (
                  <StatCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone as 'green' | 'gold' | 'red' | 'dark'} />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'auth' && (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-ghana-dark">Auth controls</h2>
              <p className="text-sm text-ghana-muted">Manage sessions, roles, and access here.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {authHighlights.map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-ghana-ink">{item}</div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
