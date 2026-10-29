import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, Building2, Camera, ClipboardList, FileCheck2, HardHat, History,
  Inbox, LayoutDashboard, QrCode, ShieldCheck, Smartphone, UserCog, Users, Wrench, type LucideIcon,
} from 'lucide-react'
import { OrderTicket } from '@/components/landing/OrderTicket'
import { QrSticker } from '@/components/landing/QrSticker'

// Signed-in users never see this page: proxy.ts redirects `/` to their dashboard.

const TRADES = [
  'Aire acondicionado', 'Plantas eléctricas', 'Subestaciones', 'Ascensores', 'Bombas y motores',
  'Tableros eléctricos', 'Refrigeración', 'Redes eléctricas', 'Obras civiles', 'Sistemas contra incendio',
]

const CYCLE: { icon: LucideIcon; who: string; title: string; text: string }[] = [
  { icon: Inbox, who: 'Cliente', title: 'Solicita', text: 'Pide un servicio desde su portal, sin llamadas ni chats perdidos.' },
  { icon: ClipboardList, who: 'Administrador', title: 'Asigna', text: 'Convierte la solicitud en orden, define prioridad y elige al técnico.' },
  { icon: Wrench, who: 'Técnico', title: 'Ejecuta', text: 'Escanea el QR del equipo, inicia la orden y la cierra con su reporte.' },
  { icon: History, who: 'Cliente', title: 'Consulta', text: 'Ve el trabajo realizado y el historial completo de cada equipo.' },
]

const BLUEPRINT = {
  backgroundImage:
    'linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
}

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* ───────────── Hero ───────────── */}
      <header className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={BLUEPRINT} />
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary opacity-30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-30%] left-[-10%] h-96 w-96 rounded-full bg-accent-cyan opacity-10 blur-3xl" />

        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} priority className="h-9 w-9" />
            <span className="font-heading text-2xl font-extrabold tracking-tight">Fixo</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-blue-100 md:flex">
            <a href="#ciclo" className="hover:text-white">Cómo funciona</a>
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#roles" className="hover:text-white">Para tu equipo</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-blue-100 hover:text-white">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="hidden rounded-full bg-highlight px-4 py-2 text-sm font-semibold text-navy transition hover:brightness-105 sm:inline-flex"
            >
              Registrar empresa
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-10 pb-24 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-16 lg:pb-32">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs tracking-wide text-accent-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-highlight" />
              SERVICIOS DE CAMPO · MANTENIMIENTO · OBRAS
            </p>
            <h1 className="font-heading mt-6 text-5xl leading-[0.98] font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Cada equipo con su historia.{' '}
              <span className="relative text-highlight sm:whitespace-nowrap">
                Cada orden, cerrada.
                <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-2 left-0 hidden h-3 w-full sm:block" preserveAspectRatio="none">
                  <path d="M2 9 C 80 2, 200 2, 298 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-blue-100/90">
              Fixo conecta a tu oficina, tus técnicos y tus clientes: órdenes de trabajo, equipos con código QR,
              obras con avance y un portal donde el cliente ve todo lo que hiciste.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-7 font-semibold shadow-lg shadow-primary/40 transition hover:bg-brand-dark"
              >
                Registrar mi empresa
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 px-7 font-semibold text-white transition hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-blue-200/80">
              <Smartphone size={16} /> En la web y en la app móvil para tus técnicos.
            </p>
          </div>

          {/* Product composition */}
          <div className="relative mx-auto flex w-full max-w-md justify-center lg:justify-end">
            <div className="animate-float">
              <OrderTicket />
            </div>
            <QrSticker code="FX-8K2M5Q7R1T" className="absolute -bottom-16 -left-2 hidden -rotate-6 sm:block lg:-left-16" />
            <span aria-hidden className="absolute -top-6 right-6 rotate-3 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-navy shadow-lg">
              Tiempo real
            </span>
          </div>
        </div>

        {/* Trades marquee */}
        <div className="relative border-t border-white/10 bg-navy-dark/60 py-4">
          <div className="flex w-max animate-marquee gap-10 pr-10 font-mono text-sm text-blue-200/70">
            {[...TRADES, ...TRADES].map((t, i) => (
              <span key={i} aria-hidden={i >= TRADES.length} className="flex items-center gap-10 whitespace-nowrap">
                {t} <span className="text-highlight">✦</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* ───────────── Cycle ───────────── */}
        <section id="ciclo" className="mx-auto max-w-7xl scroll-mt-10 px-4 py-24 sm:px-6 lg:py-32">
          <SectionTitle
            kicker="El ciclo completo"
            title="De la solicitud al historial, sin papeles en el camino."
            text="Cada servicio pasa por las mismas cuatro paradas. Fixo las conecta para que nadie pregunte «¿y eso en qué va?»."
          />
          <div className="relative mt-16">
            {/* Circuit line with a travelling spark (desktop) */}
            <div aria-hidden className="absolute top-7 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 lg:block">
              <span className="absolute -top-[5px] h-3 w-3 animate-travel rounded-full bg-highlight shadow-[0_0_14px_3px_#fec704]" />
            </div>
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {CYCLE.map(({ icon: Icon, who, title, text }, i) => (
                <li key={title} className="relative text-center">
                  <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white shadow-lg shadow-navy/20 ring-8 ring-white">
                    <Icon size={24} />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-highlight font-mono text-xs font-bold text-navy">
                      {i + 1}
                    </span>
                  </span>
                  <p className="mt-5 font-mono text-xs tracking-widest text-primary uppercase">{who}</p>
                  <h3 className="font-heading mt-1 text-2xl font-bold text-gray-900">{title}</h3>
                  <p className="mx-auto mt-2 max-w-60 text-sm text-gray-500">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────────── Features bento ───────────── */}
        <section id="funciones" className="scroll-mt-10 bg-gray-50 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionTitle
              kicker="Funciones"
              title="Lo que tu operación necesita, nada que estorbe."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-6">
              {/* Work orders — large */}
              <BentoCard className="md:col-span-4" icon={ClipboardList} title="Órdenes de trabajo"
                text="Crea, prioriza y asigna. Tus técnicos las inician y las cierran con el trabajo realizado, observaciones y pendientes.">
                <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                  {[
                    { n: 'OT-0142', d: 'Chiller 2 no enfría', s: 'En proceso', c: 'bg-blue-100 text-blue-800', dot: 'bg-primary' },
                    { n: 'OT-0141', d: 'Preventivo planta eléctrica', s: 'Pendiente', c: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
                    { n: 'OT-0139', d: 'Cambio de breaker tablero B', s: 'Completada', c: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
                  ].map((o) => (
                    <div key={o.n} className="flex items-center px-4 py-3">
                      <span className={`mr-3 h-2.5 w-2.5 rounded-full ${o.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-gray-900">{o.n}</p>
                        <p className="truncate text-sm text-gray-600">{o.d}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${o.c}`}>{o.s}</span>
                    </div>
                  ))}
                </div>
              </BentoCard>

              {/* QR */}
              <BentoCard dark className="md:col-span-2" icon={QrCode} title="Equipos con QR"
                text="Cada equipo recibe un código único y una etiqueta imprimible. Escanéalo y aparece su ficha con todo su historial.">
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <Camera size={20} className="text-accent-cyan" />
                  <span className="font-mono text-sm text-blue-100">FX-8K2M5Q7R1T</span>
                </div>
              </BentoCard>

              {/* Projects */}
              <BentoCard className="md:col-span-3" icon={HardHat} title="Obras con avance"
                text="Agrupa órdenes por proyecto y sigue el avance y el presupuesto de cada obra.">
                <div className="mt-6 space-y-4">
                  {[['Torre Médica · Red eléctrica', 72], ['Bodega 4 · Climatización', 38]].map(([name, pct]) => (
                    <div key={name}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium text-gray-800">{name}</span>
                        <span className="font-mono text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </BentoCard>

              {/* Client portal */}
              <BentoCard className="md:col-span-3" icon={FileCheck2} title="Portal del cliente"
                text="Tus clientes entran a ver sus equipos, el historial de mantenimientos y piden servicios sin llamarte.">
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Mis equipos', 'Historial', 'Solicitar servicio'].map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-navy">{t}</span>
                  ))}
                </div>
              </BentoCard>

              {/* Small cards */}
              <SmallFeature className="md:col-span-2" icon={Building2} title="Multiempresa"
                text="Cada empresa con sus datos, su logo y su equipo, aislados del resto." />
              <SmallFeature className="md:col-span-2" icon={ShieldCheck} title="Permisos por rol"
                text="Cada persona ve y edita solo lo que le corresponde." />
              <SmallFeature className="md:col-span-2" icon={Smartphone} title="App para el técnico"
                text="En el celular: órdenes del día, escáner QR y reporte de cierre." />
            </div>
          </div>
        </section>

        {/* ───────────── Roles ───────────── */}
        <section id="roles" className="mx-auto max-w-7xl scroll-mt-10 px-4 py-24 sm:px-6 lg:py-32">
          <SectionTitle kicker="Para tu equipo" title="Un solo sistema, tres miradas." />
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            <RoleCard icon={LayoutDashboard} role="Administrador" accent="bg-primary"
              items={['Panel con lo que requiere atención', 'Clientes, equipos, obras y técnicos', 'Invitaciones a tu equipo y a tus clientes']} />
            <RoleCard icon={UserCog} role="Técnico" accent="bg-accent-cyan"
              items={['Sus órdenes asignadas, por prioridad', 'Escanea el QR y ve la ficha del equipo', 'Cierra la orden con su reporte']} />
            <RoleCard icon={Users} role="Cliente" accent="bg-highlight"
              items={['Sus equipos con ficha técnica', 'Historial de cada mantenimiento', 'Solicitudes de servicio en línea']} />
          </div>
        </section>

        {/* ───────────── Business types ───────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:pb-32">
          <div className="grid gap-4 rounded-[32px] border border-gray-100 bg-gray-50 p-6 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="font-mono text-xs tracking-widest text-primary uppercase">Se adapta a tu negocio</p>
              <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Mantenimiento, construcción o ambos.
              </h2>
              <p className="mt-3 text-gray-500">Al registrar tu empresa eliges qué haces y Fixo muestra solo los módulos que usas.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Wrench, t: 'Mantenimiento', d: 'Servicio técnico y mantenimiento de equipos' },
                { icon: HardHat, t: 'Construcción', d: 'Obras y proyectos con avance y presupuesto' },
                { icon: Building2, t: 'Ambos', d: 'Mantenimiento de equipos y ejecución de obras' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <Icon size={22} className="text-primary" />
                  <p className="mt-3 font-semibold text-gray-900">{t}</p>
                  <p className="mt-1 text-sm text-gray-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── CTA ───────────── */}
        <section className="px-4 pb-6 sm:px-6">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-navy px-6 py-20 text-center text-white sm:px-12">
            <div aria-hidden className="pointer-events-none absolute inset-0" style={BLUEPRINT} />
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary opacity-40 blur-3xl" />
            <Image src="/logo.png" alt="" width={72} height={72} className="relative mx-auto h-18 w-18 animate-float" />
            <h2 className="font-heading relative mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Pon tu operación de campo <span className="text-highlight">en orden.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-blue-100/90">
              Registra tu empresa, invita a tus técnicos y crea tu primera orden hoy mismo.
            </p>
            <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-highlight px-7 font-semibold text-navy transition hover:brightness-105">
                Registrar mi empresa <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 px-7 font-semibold transition hover:bg-white/10">
                Ingresar
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-gray-400 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" />
          <span className="font-heading font-bold text-gray-700">Fixo</span>
          <span>· Gestión de servicios de campo</span>
        </div>
        <Link href="/login" className="hover:text-gray-600">Ingresar</Link>
      </footer>
    </div>
  )
}

function SectionTitle({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs tracking-widest text-primary uppercase">{kicker}</p>
      <h2 className="font-heading mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-gray-500">{text}</p>}
    </div>
  )
}

function BentoCard({
  icon: Icon, title, text, children, className = '', dark = false,
}: { icon: LucideIcon; title: string; text: string; children?: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] p-7 ${dark ? 'bg-navy text-white' : 'border border-gray-100 bg-white'} ${className}`}>
      {dark && <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-primary opacity-30 blur-2xl" />}
      <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-accent-cyan' : 'bg-blue-100 text-primary'}`}>
        <Icon size={22} />
      </span>
      <h3 className={`font-heading relative mt-5 text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`relative mt-2 ${dark ? 'text-blue-100/80' : 'text-gray-500'}`}>{text}</p>
      <div className="relative">{children}</div>
    </div>
  )
}

function SmallFeature({ icon: Icon, title, text, className = '' }: { icon: LucideIcon; title: string; text: string; className?: string }) {
  return (
    <div className={`flex gap-4 rounded-[28px] border border-gray-100 bg-white p-6 ${className}`}>
      <Icon size={22} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{text}</p>
      </div>
    </div>
  )
}

function RoleCard({ icon: Icon, role, accent, items }: { icon: LucideIcon; role: string; accent: string; items: string[] }) {
  return (
    <div className="group rounded-[28px] border border-gray-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/5">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} ${accent === 'bg-highlight' ? 'text-navy' : 'text-white'}`}>
          <Icon size={22} />
        </span>
        <h3 className="font-heading text-2xl font-bold text-gray-900">{role}</h3>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((it) => (
          <li key={it} className="flex gap-3 text-gray-600">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${accent}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
