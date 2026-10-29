import Link from 'next/link'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Page title row: optional back link, title, subtitle and actions on the right. */
export function PageHeader({
  title, subtitle, backHref, actions, children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  backHref?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ChevronLeft size={18} /> Volver
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {children}
          <h1 className="font-heading text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Primary pill button, as a link. */
export function PrimaryLink({ href, icon: Icon, children }: { href: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-brand-dark"
    >
      {Icon && <Icon size={18} strokeWidth={2.4} />}
      {children}
    </Link>
  )
}

/** Placeholder card for lists with no items. */
export function EmptyState({
  icon: Icon, title, message, action,
}: { icon: LucideIcon; title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon size={26} className="text-gray-400" strokeWidth={1.8} />
      </span>
      <p className="font-semibold text-gray-900">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Small icon + secondary text line (client, location, date…) inside list cards. */
export function MetaRow({ icon: Icon, children, className }: { icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mt-1 flex items-center gap-1.5 text-xs text-gray-500', className)}>
      <Icon size={13} className="shrink-0 text-gray-400" />
      <span className="truncate">{children}</span>
    </p>
  )
}

/** Rounded status/priority pill. */
export function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', className)}>{children}</span>
}

export function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

/** Label/value row inside a white card (`divide-y` on the parent draws separators). */
export function InfoRow({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon size={18} className="shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        {href
          ? <a href={href} className="font-medium text-primary hover:underline">{value}</a>
          : <p className="text-gray-900">{value}</p>}
      </div>
    </div>
  )
}

/** Whole-card link with a chevron, used by list rows. */
export function CardLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn('group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-blue-100 hover:shadow-sm', className)}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight size={18} className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-400" />
    </Link>
  )
}
