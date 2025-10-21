import { create } from 'zustand';

const useAuthStore = create((set) => ({
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
  },
  
  setUser: (userData) => {
     set({
        user: userData,
        isAuthenticated: true 
     });
  }
}));

export default useAuthStore;