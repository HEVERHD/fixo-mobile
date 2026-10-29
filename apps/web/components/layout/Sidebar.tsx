'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database.types'
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  UserCog,
  DollarSign,
  LogOut,
  QrCode,
  FileText,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  /** Shorter label for the mobile tab bar. */
  short: string
  href: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { label: 'Inicio', short: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Órdenes de trabajo', short: 'Órdenes', href: '/admin/ordenes', icon: ClipboardList },
  { label: 'Equipos / QR', short: 'Equipos', href: '/admin/activos', icon: QrCode },
  { label: 'Clientes', short: 'Clientes', href: '/admin/clientes', icon: Users },
  { label: 'Técnicos', short: 'Técnicos', href: '/admin/operarios', icon: UserCog },
  { label: 'Financiero', short: 'Finanzas', href: '/admin/financiero', icon: DollarSign },
]

const operarioNav: NavItem[] = [
  { label: 'Mis órdenes', short: 'Órdenes', href: '/operario', icon: ClipboardList },
  { label: 'Equipos', short: 'Equipos', href: '/operario/activos', icon: Package },
]

const clienteNav: NavItem[] = [
  { label: 'Resumen', short: 'Inicio', href: '/cliente', icon: LayoutDashboard },
  { label: 'Mis equipos', short: 'Equipos', href: '/cliente/activos', icon: Package },
  { label: 'Cotizaciones', short: 'Cotizaciones', href: '/cliente/cotizaciones', icon: FileText },
]

const navByRole: Record<Role, NavItem[]> = {
  admin: adminNav,
  operario: operarioNav,
  cliente: clienteNav,
}

const roleLabel: Record<Role, string> = {
  admin: 'Administrador',
  operario: 'Técnico',
  cliente: 'Cliente',
}

const ROOTS = ['/admin', '/operario', '/cliente']

function isActive(pathname: string, href: string) {
  return ROOTS.includes(href) ? pathname === href : pathname.startsWith(href)
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
}

interface SidebarProps {
  role: Role
  fullName: string
}

/** Navy sidebar on desktop, bottom tab bar on small screens (like the mobile app). */
export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = navByRole[role] ?? []

  return (
    <>
      <aside className="relative hidden h-full w-68 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-24 h-56 w-56 rounded-full bg-primary opacity-30 blur-2xl" />

        {/* Brand */}
        <Link href={navItems[0]?.href ?? '/'} className="relative flex items-center gap-3 px-6 py-6">
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
          <div>
            <p className="font-heading text-xl leading-none font-extrabold tracking-tight">Fixo</p>
            <p className="mt-1 text-xs text-blue-200">Servicios de campo</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-blue-100/80 hover:bg-sidebar-accent hover:text-white'
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="relative m-3 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highlight text-sm font-bold text-navy">
              {initials(fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="text-xs text-blue-200">{roleLabel[role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-blue-100/80 transition-colors hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile: top bar + bottom tabs */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-heading text-lg font-extrabold">Fixo</span>
        </div>
        <button onClick={handleLogout} className="rounded-full p-2 text-blue-100 hover:bg-white/10" aria-label="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navItems.slice(0, 5).map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                active ? 'text-primary' : 'text-gray-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
              {short}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
