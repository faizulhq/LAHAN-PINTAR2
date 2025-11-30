import axiosClient from './axiosClient';

// Ambil daftar role dari backend (untuk dropdown)
export const getRoles = async () => {
  const response = await axiosClient.get('/auth/roles/');
  return response.data;
};