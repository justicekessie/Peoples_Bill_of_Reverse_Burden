import { AuthShell } from '@/components/layout'

export default function TermsPage() {
  return (
    <AuthShell>
      <section className="mx-auto max-w-[760px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ghana-green">Terms</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-ghana-dark">Terms of Service</h1>
          <p className="mt-4 text-sm leading-7 text-ghana-muted">
            This is a placeholder page for the preview environment. Add your actual terms before launch.
          </p>
        </div>
      </section>
    </AuthShell>
  )
}