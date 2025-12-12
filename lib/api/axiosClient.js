import axios from "axios";
// 1. Impor 'refresh' dari file auth Anda
import { refresh } from "./auth";
// 2. Impor store untuk logout jika refresh gagal
import useAuthStore from "@/lib/store/authStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Wajib untuk mengirim cookie
});

axiosClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// --- LOGIKA REFRESH TOKEN DIMULAI DI SINI ---

// Variabel untuk mencegah loop refresh
let isRefreshing = false;
// Antrian untuk request yang gagal selagi token di-refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // 'prom.resolve(token)' tidak diperlukan karena
      // cookie di-set oleh browser (HttpOnly) dan request akan diulang
      prom.resolve(); 
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    // Jika sukses, langsung kembalikan response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Cek jika error 401 (Unauthorized) dan BUKAN request refresh itu sendiri
    if (error.response?.status === 401 && originalRequest.url !== '/api/auth/refresh/') {
      
      if (isRefreshing) {
        // Jika sudah ada proses refresh, masukkan request ini ke antrian
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Mulai proses refresh
      isRefreshing = true;

      try {
        console.log("🔄 Token kedaluwarsa, mencoba refresh...");
        
        // Panggil endpoint refresh. Cookie baru (termasuk user cookie)
        // akan otomatis di-set oleh backend via 'set_auth_cookies' & 'set_user_cookie'.
        const { data } = await refresh(); 
        
        // Update data user di store juga
        useAuthStore.getState().setUser(data.user);
        
        console.log("✅ Token berhasil di-refresh");

        // Proses semua antrian request yang gagal
        processQueue(null);
        
        // Ulangi request asli yang gagal tadi
        return axiosClient(originalRequest);

      } catch (refreshError) {
        console.error("❌ Gagal total me-refresh token:", refreshError);
        
        // Jika refresh gagal (misal: refresh_token juga expired)
        processQueue(refreshError);
        
        // Panggil logout dari store (menghapus state dan cookie 'user')
        useAuthStore.getState().logout();
        
        // Paksa redirect ke halaman login
        // (Kita tidak memanggil API logout backend karena mungkin gagal juga jika 401)
        window.location.href = '/login';
        
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // Kembalikan error lain (selain 401)
    return Promise.reject(error);
  }
);

export default axiosClient;