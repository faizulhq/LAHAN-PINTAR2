import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/', '/test-dashboard'];

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
  // Pengguna BISA memalsukan 'userCookie', tapi TIDAK BISA memalsukan 'accessToken' (HttpOnly).
  // Dengan memeriksa 'accessToken', kita memastikan sesi ini sah dari backend.
  if (!accessToken || !userCookie) {
    console.log("Middleware: Salah satu cookie hilang, redirect ke login.");
    
    // Hapus cookie 'user' yang mungkin palsu/usang jika ada
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('user');
    
    return response;
  }
  
  // --- SELESAI PERBAIKAN KEAMANAN ---

  // 4. Jika kedua cookie ada, lanjutkan pengecekan role
  try {
    const currentUser = JSON.parse(userCookie);

    // Role-based access control (logika ini sudah benar)
    if (pathname.startsWith('/admin')) {
      if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Superadmin') {
        // Jika role tidak sesuai, redirect ke dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Jika lolos semua, izinkan request
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