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

      const { user, access, refresh } = response.data;

      if (!user) {
        console.error('❌ User data tidak ada di response');
        return;
      }

      // 1. Update State
      loginToStore(user);

      // 2. Simpan USER ke Cookie dengan PATH: '/' (WAJIB)
      Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });

      // 3. Simpan Token ke Cookie dengan PATH: '/' (WAJIB)
      if (access) {
        Cookies.set('access_token', access, { expires: 1, path: '/' });
      }
      if (refresh) {
        Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
      }

      console.log('🏪 Store & Cookie updated globally');

      // Redirect sesuai Role
      const roleName = user.role?.name || user.role;
      const redirectPath = (['Admin', 'Superadmin', 'Operator'].includes(roleName))
        ? '/admin'
        : '/dashboard';

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
      const { user, access, refresh } = response.data;

      if (user) {
        loginToStore(user);
        
        // Tambahkan path: '/' di sini juga
        Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
        if (access) Cookies.set('access_token', access, { expires: 1, path: '/' });
        if (refresh) Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
        
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
      logoutFromStore();
      queryClient.clear();
      
      // Hapus cookie dengan path yang sama agar bersih
      Cookies.remove('user', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
      Cookies.remove('refresh_token', { path: '/' });
      
      router.push('/login');
    },
    onError: (error) => {
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
      Cookies.remove('refresh_token', { path: '/' });
      router.push('/login');
    }
  });
};