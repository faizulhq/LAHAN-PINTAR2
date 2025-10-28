// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-9ebe2a759744e60857214f21d26b1c7ae9d0c9aa/middleware.js
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/', '/test-dashboard'];
// Definisikan halaman yang boleh diakses Oprator di dalam /admin
const OPRATOR_ADMIN_PATHS = [
  '/admin', // Halaman dashboard admin
  '/admin/pengeluaran',
  '/admin/produksi',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Izinkan public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // --- PERBAIKAN KEAMANAN DIMULAI DI SINI ---

  // 2. Ambil KEDUA cookie
  const accessToken = request.cookies.get('access_token')?.value || null;
  const userCookie = request.cookies.get('user')?.value || null;

  const loginUrl = new URL('/login', request.url);

  // 3. Periksa apakah SALAH SATU cookie hilang
  if (!accessToken || !userCookie) {
    console.log("Middleware: Salah satu cookie hilang, redirect ke login.");
    
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user');
    
    return response;
  }
  
  // --- SELESAI PERBAIKAN KEAMANAN ---

  // 4. Jika kedua cookie ada, lanjutkan pengecekan role
  try {
    const currentUser = JSON.parse(userCookie);
    const userRole = currentUser?.role;

    // Role-based access control (LOGIKA BARU)
    if (pathname.startsWith('/admin')) {
      
      // Admin & Superadmin boleh akses semua /admin
      if (userRole === 'Admin' || userRole === 'Superadmin') {
        return NextResponse.next();
      }

      // Oprator hanya boleh akses halaman tertentu
      if (userRole === 'Oprator') {
        // Cek apakah halaman saat ini ada di daftar OPRATOR_ADMIN_PATHS
        const isAllowed = OPRATOR_ADMIN_PATHS.some(allowedPath => pathname.startsWith(allowedPath));
        if (isAllowed) {
          return NextResponse.next();
        } else {
          // Jika Oprator mencoba akses /admin/asset, redirect ke dashboard /admin
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }

      // Role lain (Investor, Viewer) tidak boleh akses /admin sama sekali
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Jika lolos semua (misal, ke /dashboard), izinkan request
    return NextResponse.next();

  } catch (err) {
    // 5. Jika 'userCookie' ada tapi JSON-nya rusak (mungkin di-tamper)
    console.error("Middleware: Gagal parse user cookie, redirect ke login.", err);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user'); // Hapus cookie yang rusak
    return response;
  }
}

// Konfigurasi matcher tetap sama
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};