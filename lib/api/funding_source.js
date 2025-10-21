import axiosClient from './axiosClient';

// Get all funding sources
export const getFundingSources = async () => {
  const response = await axiosClient.get('/fundingsource/fundingsources/');
  return response.data;
};

// Create funding source
export const createFundingSource = async (fundingSourceData) => {
  const response = await axiosClient.post('/fundingsource/fundingsources/', fundingSourceData);
  return response.data;
};

// Get single funding source
export const getFundingSource = async (id) => {
  const response = await axiosClient.get(`/fundingsource/fundingsources/${id}/`);
  return response.data;
};

// Update funding source
export const updateFundingSource = async (id, fundingSourceData) => {
  const response = await axiosClient.put(`/fundingsource/fundingsources/${id}/`, fundingSourceData);
  return response.data;
};

// Delete funding source
export const deleteFundingSource = async (id) => {
  const response = await axiosClient.delete(`/fundingsource/fundingsources/${id}/`);
  return response.data;
};