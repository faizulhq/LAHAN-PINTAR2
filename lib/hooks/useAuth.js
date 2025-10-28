// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-9ebe2a759744e60857214f21d26b1c7ae9d0c9aa/lib/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authAPI from '@/lib/api/auth';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation'; // 1. Impor useRouter

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter(); // 2. Gunakan hook useRouter

  return useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: async (response) => {
      console.log('✅ Login API Success:', response.data);

      const { user } = response.data;

      if (!user) {
        console.error('❌ User data tidak ada di response');
        // Mungkin tambahkan notifikasi error ke user di sini
        return;
      }

      console.log('👤 User Data:', user);

      // Set ke Zustand store
      loginToStore(user);

      // Set cookie 'user' (non-HttpOnly)
      Cookies.set('user', JSON.stringify(user), {
        expires: 1, // Atau sesuaikan dengan lifetime refresh token
        sameSite: 'Lax'
        // secure: process.env.NODE_ENV === 'production' // Aktifkan secure di production
      });

      console.log('🏪 Store & Cookie updated');

      // TIDAK PERLU menunggu lama karena state store sudah diupdate
      // await new Promise(resolve => setTimeout(resolve, 50)); // Hapus atau perpendek jika perlu

      // Tentukan path redirect
      const redirectPath = (user.role === 'Admin' || user.role === 'Superadmin')
        ? '/admin'
        : '/dashboard';

      console.log('🚀 Navigating (client-side) to:', redirectPath);

      // 3. GANTI window.location.href dengan router.push
      // window.location.href = redirectPath; // <-- Hapus ini
      router.push(redirectPath); // <-- Gunakan ini

      // Catatan: Setelah router.push, ProtectedRoute di halaman tujuan
      // akan berjalan dan (seharusnya) langsung menemukan state 'user'
      // yang sudah ada di Zustand, sehingga tidak perlu loading lama.
    },
    onError: (error) => {
      console.error("❌ Login failed:", error.response?.data || error.message);
      // Tambahkan notifikasi error ke user di sini
    },
  });
};

// ... (hook useRegister dan useLogout tetap sama,
//      meskipun useLogout mungkin juga lebih baik pakai router.push('/login')
//      setelah menghapus cookie & state) ...

export const useRegister = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter(); // Tambahkan router

  return useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    onSuccess: async (response) => {
      console.log('✅ Register Success:', response.data);
      const { user } = response.data;

      if (user) {
        loginToStore(user);

        Cookies.set('user', JSON.stringify(user), {
          expires: 1,
          sameSite: 'Lax'
        });

        // Redirect ke dashboard default setelah register
        // await new Promise(resolve => setTimeout(resolve, 50)); // Mungkin tidak perlu
        router.push('/dashboard'); // Gunakan router.push
      }
    },
    onError: (error) => {
      console.error("❌ Register failed:", error.response?.data || error.message);
    },
  });
};

export const useLogout = () => {
  const logoutFromStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter(); // Tambahkan router

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log('✅ Logout Success');
      logoutFromStore();
      queryClient.clear(); // Hapus cache react-query

      // Hanya hapus cookie 'user' (non-HttpOnly)
      Cookies.remove('user');

      // Gunakan router.push untuk navigasi client-side ke login
      router.push('/login');
    },
    onError: (error) => {
      console.error("❌ Logout failed:", error.response?.data || error.message);
      // Tetap lakukan cleanup di client meskipun API gagal
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user');
      router.push('/login'); // Paksa ke login
    }
  });
};