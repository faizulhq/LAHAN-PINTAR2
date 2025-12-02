import { create } from 'zustand';
import Cookies from 'js-cookie';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  // Action Login
  login: (userData) => {
    set({ user: userData, isAuthenticated: true });
    // Note: Cookie setting handled in useAuth hook usually, but sync here if needed
  },

  // Action Logout
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  // Initialize Auth (Hydration from Cookies)
  initializeAuth: () => {
    // Cookie akan terbaca sekarang karena path-nya sudah benar
    const userCookie = Cookies.get('user');
    
    if (userCookie) {
      try {
        const parsedUser = JSON.parse(userCookie);
        set({ user: parsedUser, isAuthenticated: true });
      } catch (e) {
        console.error("Gagal parsing cookie user", e);
        Cookies.remove('user', { path: '/' });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  }
}));

export default useAuthStore;