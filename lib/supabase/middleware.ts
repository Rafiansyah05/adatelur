import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request })

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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 365,
              path: '/',
              sameSite: 'lax',
            })
          )
        },
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  if (searchParams.has('token_hash') || searchParams.get('type') === 'recovery') {
    if (pathname !== '/auth/reset-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/reset-password'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }
  }

  const publicRoutes = ['/login', '/register', '/register-consumer', '/choose-role', '/auth']

  const isAuthOrStatic =
    pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')

  if (isAuthOrStatic) {
    return supabaseResponse
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  if (user && isPublicRoute && !pathname.startsWith('/register') && !pathname.startsWith('/auth/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}
