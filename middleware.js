import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/', '/test-dashboard'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value || null;
  const userCookie = request.cookies.get('user')?.value || null;

  const loginUrl = new URL('/login', request.url);

  // Check if required cookies exist
  if (!accessToken || !userCookie) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const currentUser = JSON.parse(userCookie);

    // Role-based access control for /admin
    if (pathname.startsWith('/admin')) {
      if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Superadmin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();

  } catch (err) {
    // Invalid user cookie
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};