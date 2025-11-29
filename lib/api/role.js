import axiosClient from './axiosClient';

// Get all roles
export const getRoles = async () => {
  const response = await axiosClient.get('/api/auth/roles/');
  return response.data;
};
