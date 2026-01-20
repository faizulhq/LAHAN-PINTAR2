import axiosClient from './axiosClient';

export const getDistributions = async () => {
  const response = await axiosClient.get('/api/profit-distribution/');
  return response.data;
};

// [FIX] Gunakan key 'total_distributed' agar konsisten dengan backend
export const previewDistribution = async (amount) => {
  const response = await axiosClient.post('/api/profit-distribution/preview/', { 
    total_distributed: amount 
  });
  return response.data;
};

export const createDistribution = async (data) => {
  // Data sudah berisi { total_distributed: ..., date: ... } dari form
  const response = await axiosClient.post('/api/profit-distribution/', data);
  return response.data;
};

export const deleteDistribution = async (id) => {
  const response = await axiosClient.delete(`/api/profit-distribution/${id}/`);
  return response.data;
};