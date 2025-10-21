import axiosClient from './axiosClient';

// Get all fundings
export const getFundings = async () => {
  const response = await axiosClient.get('/api/funding/fundings/');
  return response.data;
};

// Create funding
export const createFunding = async (fundingData) => {
  const response = await axiosClient.post('/api/funding/fundings/', fundingData);
  return response.data;
};

// Get single funding
export const getFunding = async (id) => {
  const response = await axiosClient.get(`/api/funding/fundings/${id}/`);
  return response.data;
};

// Update funding
export const updateFunding = async (id, fundingData) => {
  const response = await axiosClient.put(`/api/funding/fundings/${id}/`, fundingData);
  return response.data;
};

// Delete funding
export const deleteFunding = async (id) => {
  const response = await axiosClient.delete(`/api/funding/fundings/${id}/`);
  return response.data;
};