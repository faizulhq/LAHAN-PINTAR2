'use client';

import { useEffect } from 'react';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';

function AuthHydrator() {
  useEffect(() => {
    const currentState = useAuthStore.getState();

    // Hanya jalankan jika belum ter-hydrate
    if (!currentState.isHydrated) {
      console.log("💧 [AuthHydrator] Memulai proses hydration...");
      const userCookie = Cookies.get('user');

      if (userCookie) {
        console.log("💧 [AuthHydrator] Menemukan cookie:", userCookie);
        try {
          // Sekarang kita percaya cookie-nya valid JSON
          const userData = JSON.parse(userCookie);
          console.log("💧 [AuthHydrator] Parse cookie BERHASIL:", userData);
          currentState.setUser(userData); // Set user & isHydrated
        } catch (e) {
          console.error("💧 [AuthHydrator] Gagal parse cookie JSON:", e.message);
          Cookies.remove('user'); // Hapus jika rusak
          currentState.setHydrated(); // Tandai hydrated meskipun gagal parse
        }
      } else {
        console.log("💧 [AuthHydrator] Tidak ada cookie.");
        currentState.setHydrated(); // Tandai hydrated jika tidak ada cookie
      }
    } else {
       console.log("💧 [AuthHydrator] State sudah hydrated, skip.");
    }
  }, []); // Hanya berjalan sekali

  return null;
}

export default AuthHydrator;