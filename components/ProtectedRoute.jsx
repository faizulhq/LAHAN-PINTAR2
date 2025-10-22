'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie'; 

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // --- PERBAIKAN PENTING ---
  // Pisahkan selector state dan fungsi untuk menghindari infinite loop
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  // -------------------------

  useEffect(() => {
    // 1. Jika state sudah authenticated (misal baru login), lolos.
    if (isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // 2. Jika state belum auth, coba baca cookie 'user'.
    const userCookie = Cookies.get('user');

    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        // Set state dari cookie. Ini akan memicu re-render
        setUser(userData); 
        // useEffect akan jalan lagi, dan lolos di kondisi #1
      } catch (e) {
        // Cookie rusak
        Cookies.remove('user');
        router.replace('/login');
      }
    } else {
      // 3. Tidak ada state, tidak ada cookie, tendang.
      router.replace('/login');
    }

  }, [isAuthenticated, router, setUser]); 

  // Tampilkan loading saat proses pengecekan awal
  if (isLoading) {
    return <div>Loading...</div>; 
  }

  // Jika sudah lolos pengecekan (isLoading=false) dan 
  // state-nya sudah benar (isAuthenticated=true), render children.
  if (isAuthenticated) {
    return children;
  }

  // Fallback (seharusnya tidak tampil lama)
  return <div>Loading...</div>;
};

export default ProtectedRoute;