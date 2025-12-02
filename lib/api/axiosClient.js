import axios from 'axios';
import Cookies from 'js-cookie';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000', // Pastikan port sesuai backend Anda
  withCredentials: true, // Tetap biarkan true
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR: Paksa tempel Token di Header
axiosClient.interceptors.request.use(
  (config) => {
    // Ambil token yang kita simpan manual di authStore
    const token = Cookies.get('access_token');
    
    // Jika token ada, tempelkan sebagai Header Authorization
    // Ini mem-bypass masalah cookie HttpOnly yang tidak terbaca
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR: Handle Token Mati (401)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 (Unauthorized) dan belum pernah retry sebelumnya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token kedaluwarsa, mencoba refresh manual...');
        
        // Ambil refresh token yang kita simpan manual
        const refreshToken = Cookies.get('refresh_token');

        if (!refreshToken) {
          throw new Error('Tidak ada refresh token');
        }

        // Panggil endpoint refresh token
        // PENTING: Kirim refresh token di BODY, bukan cuma andalkan cookie
        const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
          refresh: refreshToken 
        });

        const { access } = response.data;

        // Simpan token baru ke cookie manual
        Cookies.set('access_token', access, { expires: 1 });

        // Update header request yang gagal tadi dengan token baru
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Ulangi request yang gagal
        return axiosClient(originalRequest);

      } catch (refreshError) {
        console.error('❌ Gagal total me-refresh token:', refreshError);
        
        // Jika refresh gagal total, bersihkan jejak dan redirect login
        Cookies.remove('user');
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        
        // Redirect paksa ke login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;