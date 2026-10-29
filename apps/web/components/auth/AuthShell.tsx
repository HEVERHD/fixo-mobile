import Image from 'next/image'
import Link from 'next/link'
import { ClipboardCheck, QrCode, Users } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: ClipboardCheck, text: 'Órdenes de trabajo de la solicitud al reporte final' },
  { icon: QrCode, text: 'Cada equipo con su código QR e historial' },
  { icon: Users, text: 'Administradores, técnicos y clientes en un solo lugar' },
]

/**
 * Shared shell for auth pages, mirroring the mobile AuthLayout:
 * navy brand panel + white form sheet (stacked on small screens, side by side on desktop).
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-navy lg:flex-row">
      {/* Decorative brand shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary opacity-25 blur-2xl lg:right-auto lg:left-[30%]" />
        <div className="absolute top-40 -left-20 h-48 w-48 rounded-full bg-accent-cyan opacity-10 blur-xl" />
        <div className="absolute top-16 left-10 h-3 w-3 rounded-full bg-highlight opacity-80" />
      </div>

      {/* Brand panel */}
      <div className="relative flex flex-1 flex-col items-center justify-end px-6 pt-12 pb-10 text-center lg:items-start lg:justify-between lg:p-14 lg:text-left">
        <Link href="/" className="flex flex-col items-center gap-4 lg:flex-row lg:gap-3">
          <Image src="/logo.png" alt="" width={80} height={80} priority className="h-20 w-20 animate-float lg:h-11 lg:w-11 lg:animate-none" />
          <span className="font-heading text-4xl font-extrabold tracking-tight text-white lg:text-2xl">Fixo</span>
        </Link>
        <p className="mt-2 text-sm text-blue-200 lg:hidden">Gestión de servicios de campo</p>

        <div className="hidden max-w-md lg:block">
          <h2 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight text-white">
            Tu operación de campo, <span className="text-highlight">en orden.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={20} className="text-accent-cyan" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-blue-300/70 lg:block">Gestión de servicios de campo</p>
      </div>

      {/* Form sheet */}
      <div className="relative rounded-t-[32px] bg-white px-6 pt-8 pb-10 lg:flex lg:w-130 lg:shrink-0 lg:items-center lg:rounded-none lg:rounded-l-[40px] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-heading text-2xl font-bold text-gray-900 lg:text-3xl">{title}</h1>
          <p className="mt-1 mb-7 text-sm text-gray-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
