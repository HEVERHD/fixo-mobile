import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/qr']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow public routes
  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname === '/'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Get role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirect root to role dashboard
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = role ? `/${role}` : '/login'
      return NextResponse.redirect(url)
    }

    // Guard role-specific paths
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = `/${role ?? 'login'}`
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/operario') && role !== 'operario') {
      const url = request.nextUrl.clone()
      url.pathname = `/${role ?? 'login'}`
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/cliente') && role !== 'cliente') {
      const url = request.nextUrl.clone()
      url.pathname = `/${role ?? 'login'}`
      return NextResponse.redirect(url)
    }

    // Redirect /login to dashboard if already authenticated
    if (pathname === '/login' || pathname === '/register') {
      if (!role) return supabaseResponse  // no profile yet — let them log in again
      const url = request.nextUrl.clone()
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
