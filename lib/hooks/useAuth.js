import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authAPI from '@/lib/api/auth';
import useAuthStore from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: (response) => {
      const { user } = response.data;
      console.log("✅ Login Berhasil", response.data); 
      loginToStore(user);
      console.log("🚀 State Zustand di-set, mengarahkan ke /dashboard...");
      router.push('/dashboard'); 
    },
    onError: (error) => {
      console.error("❌ Login Gagal:", error.response?.data || error.message); 
    },
  });
};

export const useRegister = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    onSuccess: (response) => {
      const { user } = response.data;
      console.log("✅ Registrasi Berhasil", response.data); 
      loginToStore(user);
      console.log("🚀 State Zustand di-set, mengarahkan ke /dashboard...");
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error("❌ Registrasi Gagal:", error.response?.data || error.message); 
    },
  });
};

export const useLogout = () => {
  const logoutFromStore = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log("✅ Logout Berhasil"); 
      logoutFromStore();
      queryClient.clear(); 
      router.push('/login');
    },
    onError: (error) => {
      console.error("❌ Logout API Gagal:", error.response?.data || error.message); 
      logoutFromStore();
      queryClient.clear(); 
      router.push('/login');
    }
  });

  return logoutMutation;
};