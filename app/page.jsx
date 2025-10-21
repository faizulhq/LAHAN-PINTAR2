'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Impor js-cookie

// Fungsi helper kecil untuk membaca cookie, menggantikan 'getUser'
const getRoleFromCookie = () => {
  try {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      return userData.role || null;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userRole = getRoleFromCookie();
    
    if (userRole) {
      if (userRole === 'Admin' || userRole === 'Superadmin') {
        router.push('/admin'); // Arahkan ke halaman admin baru
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return <p>Loading...</p>;
}