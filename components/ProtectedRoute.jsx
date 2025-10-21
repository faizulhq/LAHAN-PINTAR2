'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isHydrated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isHydrated: state.isHydrated,
  }));
  const router = useRouter();

  console.log("🛡️ [ProtectedRoute] Dijalankan. State:", { isAuthenticated, isHydrated });

  useEffect(() => {
    // WAJIB: Tunggu hydration selesai
    if (!isHydrated) {
      console.log("🛡️ [ProtectedRoute] Menunggu AuthHydrator...");
      return;
    }

    // SETELAH hydrated, baru cek auth
    if (!isAuthenticated) {
      console.log("🛡️ [ProtectedRoute] Gagal! (Hydrated tapi !Auth). Redirect ke /login.");
      router.replace('/login');
    } else {
      console.log("🛡️ [ProtectedRoute] Lolos! (Hydrated & Auth).");
    }
  }, [isAuthenticated, isHydrated, router]);

  // Tampilkan loading jika belum hydrated
  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  // Jika hydrated DAN authenticated, tampilkan halaman
  if (isAuthenticated) {
    return children;
  }

  // Fallback jika !isAuthenticated (selama proses redirect)
  return <div>Loading...</div>; // Atau bisa null
};

export default ProtectedRoute;