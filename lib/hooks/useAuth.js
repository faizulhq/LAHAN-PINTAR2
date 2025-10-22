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
      loginToStore(user);
      router.push('/dashboard'); 
    },
    onError: (error) => {
      console.error("Login failed:", error.response?.data || error.message);
      // Anda bisa tambahkan notifikasi error untuk user di sini (misal: message.error())
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
      loginToStore(user);
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error("Register failed:", error.response?.data || error.message);
      // Anda bisa tambahkan notifikasi error untuk user di sini
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
      logoutFromStore();
      queryClient.clear(); 
      router.push('/login');
    },
    onError: (error) => {
      console.error("Logout API failed:", error.response?.data || error.message);
      // Tetap paksa logout di frontend
      logoutFromStore();
      queryClient.clear(); 
      router.push('/login');
    }
  });

  return logoutMutation;
};