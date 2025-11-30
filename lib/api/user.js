import axiosClient from './axiosClient';

// Ambil semua user
export const getUsers = async () => {
  const response = await axiosClient.get('/auth/users/');
  return response.data;
};

// Buat user baru
export const createUser = async (userData) => {
  const response = await axiosClient.post('/auth/users/', userData);
  return response.data;
};

// Update user (termasuk ganti role/password)
export const updateUser = async (id, userData) => {
  const response = await axiosClient.put(`/auth/users/${id}/`, userData);
  return response.data;
};

// Hapus user
export const deleteUser = async (id) => {
  const response = await axiosClient.delete(`/auth/users/${id}/`);
  return response.data;
};