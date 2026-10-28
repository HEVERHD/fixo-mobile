'use client'

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
  Zap,
  QrCode,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Órdenes de Trabajo', href: '/admin/ordenes', icon: <ClipboardList size={18} /> },
  { label: 'Activos / QR', href: '/admin/activos', icon: <QrCode size={18} /> },
  { label: 'Clientes', href: '/admin/clientes', icon: <Users size={18} /> },
  { label: 'Operarios', href: '/admin/operarios', icon: <UserCog size={18} /> },
  { label: 'Financiero', href: '/admin/financiero', icon: <DollarSign size={18} /> },
]

const operarioNav: NavItem[] = [
  { label: 'Mis Órdenes', href: '/operario', icon: <ClipboardList size={18} /> },
  { label: 'Activos', href: '/operario/activos', icon: <Package size={18} /> },
]

const clienteNav: NavItem[] = [
  { label: 'Resumen', href: '/cliente', icon: <LayoutDashboard size={18} /> },
  { label: 'Mis Activos', href: '/cliente/activos', icon: <Package size={18} /> },
  { label: 'Cotizaciones', href: '/cliente/cotizaciones', icon: <FileText size={18} /> },
]

const navByRole: Record<Role, NavItem[]> = {
  admin: adminNav,
  operario: operarioNav,
  cliente: clienteNav,
}

interface SidebarProps {
  role: Role
  fullName: string
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = navByRole[role] ?? []

  const roleLabel: Record<Role, string> = {
    admin: 'Administrador',
    operario: 'Operario',
    cliente: 'Cliente',
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Fixo</p>
          <p className="text-xs text-muted-foreground">Gestión de Servicios</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin' || item.href === '/operario' || item.href === '/cliente'
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t p-3">
        <div className="mb-2 px-3 py-2">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel[role]}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
