import axios from "axios";

// Menggunakan localhost agar domainnya sama dengan frontend (localhost:3000)
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

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Anda bisa tambahkan logika penanganan error global di sini
    // (misalnya, auto-logout jika 401)
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized. Token expired or invalid.");
      // Opsi: Panggil logout dari store di sini jika token gagal total
      // useAuthStore.getState().logout();
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;