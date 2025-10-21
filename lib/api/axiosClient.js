import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
console.log("🌐 Using API base URL:", BASE_URL)

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, 
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
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized. Token expired or invalid.");
    } else if (error.response?.status === 403) {
      console.warn("🚫 Forbidden. User not allowed to access this resource.");
    } else if (error.response?.status === 500) {
      console.error("💥 Server Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;