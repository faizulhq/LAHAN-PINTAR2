import axiosClient from "./axiosClient";

export const login = async (credentials) => {
  const response = await axiosClient.post("/api/auth/login/", credentials);
  return response;
};

export const register = async (userData) => {
  const response = await axiosClient.post("/api/auth/register/", userData);
  return response;
};

export const logout = async () => {
  const response = await axiosClient.post("/api/auth/logout/");
  return response;
};

export const refresh = async () => {
  const response = await axiosClient.post("/api/auth/refresh/");
  return response;
};