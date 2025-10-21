import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/register', '/'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value || null;
  const loginUrl = new URL('/login', request.url);

  if (!accessToken) {
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    const userCookie = request.cookies.get('user')?.value;
    const currentUser = userCookie ? JSON.parse(userCookie) : null;

    const secret = new TextEncoder().encode(
      'django-insecure-*h_(c9)yydu8u7lsp)9d#z!p*5j6b%6m)4)y2$b%-pfcpp5lz6'
    );
    
    await jwtVerify(accessToken, secret);
    
    if (pathname.startsWith('/admin') && (currentUser?.role !== 'Admin' && currentUser?.role !== 'Superadmin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();

  } catch (err) {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}