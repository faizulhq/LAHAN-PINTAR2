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
      const { user } = response.data;

      if (!user) {
        return;
      }

      loginToStore(user);
      Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
      router.push('/admin');
    },
    onError: (error) => {
      console.error(error.response?.data || error.message);
    },
  });
};

export const useRegister = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    onSuccess: async (response) => {
      const { user } = response.data;

      if (user) {
        loginToStore(user);
        Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
        router.push('/admin');
      }
    },
    onError: (error) => {
      console.error(error.response?.data || error.message);
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
      Cookies.remove('user', { path: '/' });
      router.push('/login');
    },
    onError: (error) => {
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user', { path: '/' });
      router.push('/login');
    }
  });
};