import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const isDevelopmentBypassActive = () => {
    return process.env.NODE_ENV === 'development' && process.env.DEV_MODE_BYPASS === 'true';
  };

  if (isDevelopmentBypassActive()) {
    const requestHeaders = new Headers(request.headers);
    
    // Default mock user ID (matching mock profile in Zustand store)
    const mockUserId = 'd0000000-0000-0000-0000-000000000000';
    
    // Check if there is an active-org-id cookie from switching organizations
    const activeOrgCookie = request.cookies.get('active-org-id')?.value;
    const mockOrgId = activeOrgCookie || 'e0000000-0000-0000-0000-000000000000';

    requestHeaders.set('x-dev-user-id', mockUserId);
    requestHeaders.set('x-dev-org-id', mockOrgId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set('dev-mode-bypass-active', 'true', { path: '/' });
    return response;
  }

  // Standard @supabase/ssr updateSession logic
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access /dashboard to /auth/login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, videos etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
