import axiosClient from './axiosClient';

// Get all users (Superadmin only)
export const getUsers = async () => {
  const response = await axiosClient.get('/api/auth/users/');
  return response.data;
};

// Get available users for investor creation
export const getAvailableUsersForInvestor = async () => {
  const response = await axiosClient.get('/api/auth/users/available-for-investor/');
  return response.data;
};

// Create user (Superadmin only)
export const createUser = async (userData) => {
  const response = await axiosClient.post('/api/auth/users/', userData);
  return response.data;
};

// Get single user
export const getUser = async (id) => {
  const response = await axiosClient.get(`/api/auth/users/${id}/`);
  return response.data;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await axiosClient.put(`/api/auth/users/${id}/`, userData);
  return response.data;
};

// Partial update user
export const patchUser = async (id, userData) => {
  const response = await axiosClient.patch(`/api/auth/users/${id}/`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await axiosClient.delete(`/api/auth/users/${id}/`);
  return response.data;
};