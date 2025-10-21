import axiosClient from './axiosClient';

// Get all funding sources
export const getFundingSources = async () => {
  const response = await axiosClient.get('/api/fundingsource/fundingsources/');
  return response.data;
};

// Create funding source
export const createFundingSource = async (fundingSourceData) => {
  const response = await axiosClient.post('/api/fundingsource/fundingsources/', fundingSourceData);
  return response.data;
};

// Get single funding source
export const getFundingSource = async (id) => {
  const response = await axiosClient.get(`/api/fundingsource/fundingsources/${id}/`);
  return response.data;
};

// Update funding source
export const updateFundingSource = async (id, fundingSourceData) => {
  const response = await axiosClient.put(`/api/fundingsource/fundingsources/${id}/`, fundingSourceData);
  return response.data;
};

// Delete funding source
export const deleteFundingSource = async (id) => {
  const response = await axiosClient.delete(`/api/fundingsource/fundingsources/${id}/`);
  return response.data;
};