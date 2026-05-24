import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register')
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isPublic = request.nextUrl.pathname === '/' ||
                   request.nextUrl.pathname.startsWith('/auth/') ||
                   request.nextUrl.pathname === '/api/home'
  const isProtected = !isAuthPage && !isOnboarding && !isPublic && 
                      !request.nextUrl.pathname.startsWith('/_next') &&
                      !request.nextUrl.pathname.startsWith('/favicon')

  if (!user && (isProtected || isOnboarding)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Geonboard-check: gebruiker met sessie maar nog niet voltooide onboarding
  // moet eerst naar /onboarding (behalve als ze daar al zijn of /api/onboarding hitten).
  if (user && isProtected && !request.nextUrl.pathname.startsWith('/api/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && !profile.is_onboarded) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
