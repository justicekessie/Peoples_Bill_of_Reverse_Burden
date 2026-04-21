import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-ghana-green text-white shadow-sm hover:bg-ghana-dark focus-visible:ring-ghana-green',
    secondary:
      'bg-ghana-gold text-ghana-dark hover:bg-[#e8c100] focus-visible:ring-ghana-gold',
    outline:
      'border border-border bg-transparent text-ghana-ink hover:bg-ghana-cream focus-visible:ring-ghana-green',
    ghost:
      'bg-transparent text-ghana-ink hover:bg-ghana-cream focus-visible:ring-ghana-green',
  }

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-sm',
  }

  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return <button ref={ref} type={type} className={buttonClassName({ variant, size, className })} {...props} />
  },
)
Button.displayName = 'Button'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('rounded-xl border border-border bg-white', className)} {...props} />
  },
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('border-b border-border px-6 py-5', className)} {...props} />
  },
)
CardHeader.displayName = 'CardHeader'

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('px-6 py-5', className)} {...props} />
  },
)
CardBody.displayName = 'CardBody'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('border-t border-border bg-ghana-paper px-6 py-4', className)} {...props} />
  },
)
CardFooter.displayName = 'CardFooter'

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return <label ref={ref} className={cn('mb-2 block text-sm font-semibold text-ghana-ink', className)} {...props} />
  },
)
Label.displayName = 'Label'

const fieldClassName =
  'w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-ghana-ink outline-none transition-colors placeholder:text-ghana-muted focus:border-ghana-green focus:ring-4 focus:ring-ghana-green/10'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldClassName, className)} {...props} />,
)
Input.displayName = 'Input'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(fieldClassName, className)} {...props} />,
)
Select.displayName = 'Select'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 6, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(fieldClassName, 'min-h-[180px] resize-y leading-7', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: React.PropsWithChildren<{ tone?: 'neutral' | 'green' | 'gold' | 'red' | 'dark'; className?: string }>) {
  const tones: Record<string, string> = {
    neutral: 'bg-ghana-cream text-ghana-muted border-border',
    green: 'bg-ghana-green/10 text-ghana-green border-ghana-green/20',
    gold: 'bg-ghana-gold/20 text-ghana-dark border-ghana-gold/30',
    red: 'bg-ghana-red/10 text-ghana-red border-ghana-red/20',
    dark: 'bg-ghana-dark text-white border-ghana-dark',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
}) {
  const alignment = align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start'

  return (
    <div className={cn('flex max-w-3xl flex-col gap-3', alignment)}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ghana-green">{eyebrow}</p> : null}
      <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] text-ghana-dark">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-7 text-ghana-muted">{description}</p> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  delta,
  tone = 'green',
}: {
  label: string
  value: string
  delta: string
  tone?: 'green' | 'gold' | 'red' | 'dark'
}) {
  const accents = {
    green: 'text-ghana-green',
    gold: 'text-ghana-dark',
    red: 'text-ghana-red',
    dark: 'text-ghana-dark',
  }

  return (
    <Card className="p-6 shadow-sm">
      <div className={cn('font-serif text-4xl font-bold leading-none', accents[tone])}>{value}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ghana-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold text-ghana-green">{delta}</div>
    </Card>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-ghana-light/80">
      <div className="h-2 rounded-full bg-gradient-to-r from-ghana-green to-[#00a85a]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
