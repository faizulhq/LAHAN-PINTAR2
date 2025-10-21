import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false, // <-- 1. STATE BARU

  login: (userData) => {
    console.log("🏪 authStore: login() dipanggil, state diatur ke TRUE", userData);
    set({
      user: userData,
      isAuthenticated: true,
      isHydrated: true, // <-- 2. Tandai sebagai hydrated
    });
  },

  logout: () => {
    console.log("🏪 authStore: logout() dipanggil, state diatur ke FALSE");
    set({
      user: null,
      isAuthenticated: false,
      isHydrated: true, // <-- 3. Tandai sebagai hydrated
    });
  },
  
  setUser: (userData) => {
     console.log("🏪 authStore: setUser() dipanggil (dari cookie), state diatur ke TRUE", userData);
     set({
        user: userData,
        isAuthenticated: true,
        isHydrated: true, // <-- 4. Tandai sebagai hydrated
     });
  },

  // 5. FUNGSI BARU UNTUK MENANDAI HYDRATION SELESAI
  setHydrated: () => {
    console.log("🏪 authStore: setHydrated() dipanggil (tidak ada cookie)");
    set({ isHydrated: true });
  }
}));

export default useAuthStore;