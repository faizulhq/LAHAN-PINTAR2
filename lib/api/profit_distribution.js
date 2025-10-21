import axiosClient from './axiosClient';

// Get all profit distributions
export const getProfitDistributions = async () => {
  const response = await axiosClient.get('/profit-distribution/profit-distributions/');
  return response.data;
};

// Create profit distribution
export const createProfitDistribution = async (profitDistributionData) => {
  const response = await axiosClient.post('/profit-distribution/profit-distributions/', profitDistributionData);
  return response.data;
};

// Get single profit distribution
export const getProfitDistribution = async (id) => {
  const response = await axiosClient.get(`/profit-distribution/profit-distributions/${id}/`);
  return response.data;
};

// Update profit distribution
export const updateProfitDistribution = async (id, profitDistributionData) => {
  const response = await axiosClient.put(`/profit-distribution/profit-distributions/${id}/`, profitDistributionData);
  return response.data;
};

// Delete profit distribution
export const deleteProfitDistribution = async (id) => {
  const response = await axiosClient.delete(`/profit-distribution/profit-distributions/${id}/`);
  return response.data;
};