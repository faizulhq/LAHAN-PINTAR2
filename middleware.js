import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/', '/test-dashboard'];
const OPERATOR_ADMIN_PATHS = [
  '/admin',
  '/admin/pengeluaran',
  '/admin/produksi',
  '/admin/laporan', 
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value || null;
  const userCookie = request.cookies.get('user')?.value || null;

  const loginUrl = new URL('/login', request.url);

  if (!accessToken || !userCookie) {
    console.log("Middleware: Salah satu cookie hilang, redirect ke login.");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user');
    return response;
  }

  try {
    const currentUser = JSON.parse(userCookie);
    const userRole = currentUser?.role;

    if (pathname.startsWith('/admin')) {
      
      if (userRole === 'Admin' || userRole === 'Superadmin') {
        return NextResponse.next();
      }

      // --- PERUBAHAN DI SINI ---
      if (userRole === 'Operator') {
      // --- BATAS PERUBAHAN ---
        const isAllowed = OPERATOR_ADMIN_PATHS.some(allowedPath => pathname.startsWith(allowedPath));
        if (isAllowed) {
          return NextResponse.next();
        } else {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();

  } catch (err) {
    console.error("Middleware: Gagal parse user cookie, redirect ke login.", err);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};