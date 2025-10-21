import axiosClient from "./axiosClient";

export const login = async (credentials) => {
  const response = await axiosClient.post("/login/", credentials);
  return response;
};

export const register = async (userData) => {
  const response = await axiosClient.post("/register/", userData);
  return response;
};

export const logout = async () => {
  const response = await axiosClient.post("/logout/");
  return response;
};