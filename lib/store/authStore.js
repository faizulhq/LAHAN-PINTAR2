import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        // Hapus juga storage lokal agar bersih total
        localStorage.removeItem('auth-storage');
      },

      setUser: (userData) => {
        set({
          user: userData,
          isAuthenticated: !!userData
        });
      }
    }),
    {
      name: 'auth-storage', // Nama key di LocalStorage
      storage: createJSONStorage(() => localStorage), // Simpan di browser
      // Hanya simpan user dan status auth
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;