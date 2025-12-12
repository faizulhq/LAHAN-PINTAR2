// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-dfe2664682ace9537893ea0569b86e928b07e701/lib/hooks/useAuth.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authAPI from '@/lib/api/auth';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: async (response) => {
      console.log('✅ Login API Success:', response.data);

      const { user } = response.data;

      if (!user) {
        console.error('❌ User data tidak ada di response');
        return;
      }

      console.log('👤 User Data:', user);
      loginToStore(user);

      Cookies.set('user', JSON.stringify(user), {
        expires: 1,
        sameSite: 'Lax'
      });

      console.log('🏪 Store & Cookie updated');

      // --- PERUBAHAN DI SINI ---
      // Tentukan path redirect
      const redirectPath = (user.role === 'Admin' || user.role === 'Superadmin' || user.role === 'Operator')
        ? '/admin'
        : '/dashboard';
      // --- BATAS PERUBAHAN ---

      console.log('🚀 Navigating (client-side) to:', redirectPath);
      
      router.push(redirectPath);
    },
    onError: (error) => {
      console.error("❌ Login failed:", error.response?.data || error.message);
    },
  });
};

export const useRegister = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

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
        
        // Pengguna baru (Viewer) akan diarahkan ke dashboard, ini sudah benar.
        router.push('/dashboard');
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
  const router = useRouter();

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log('✅ Logout Success');
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user');
      router.push('/login');
    },
    onError: (error) => {
      console.error("❌ Logout failed:", error.response?.data || error.message);
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user');
      router.push('/login');
    }
  });
};