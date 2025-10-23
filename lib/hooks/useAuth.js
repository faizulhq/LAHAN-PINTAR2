import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authAPI from '@/lib/api/auth';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);

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
      
      // Set ke Zustand store
      loginToStore(user);
      
      // Set cookie 'user' (ini tidak HttpOnly, jadi bisa di-set dari JS)
      Cookies.set('user', JSON.stringify(user), { 
        expires: 1,
        sameSite: 'Lax'
      });
      
      console.log('🏪 Store & Cookie updated');
      
      // Tunggu sebentar untuk memastikan cookie ter-set
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect berdasarkan role
      const redirectPath = (user.role === 'Admin' || user.role === 'Superadmin') 
        ? '/admin' 
        : '/dashboard';
      
      console.log('🚀 Redirecting to:', redirectPath);
      
      // PENTING: Gunakan window.location.href untuk trigger middleware
      window.location.href = redirectPath;
    },
    onError: (error) => {
      console.error("❌ Login failed:", error.response?.data || error.message);
    },
  });
};

export const useRegister = () => {
  const loginToStore = useAuthStore((state) => state.login);

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
        
        await new Promise(resolve => setTimeout(resolve, 200));
        window.location.href = '/dashboard';
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

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      console.log('✅ Logout Success');
      logoutFromStore();
      queryClient.clear();
      
      // Hanya hapus cookie 'user' (yang non-HttpOnly)
      // access_token & refresh_token akan dihapus oleh backend
      Cookies.remove('user');
      
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error("❌ Logout failed:", error.response?.data || error.message);
      logoutFromStore();
      queryClient.clear();
      
      Cookies.remove('user');
      
      window.location.href = '/login';
    }
  });
};