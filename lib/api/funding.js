import axiosClient from './axiosClient';

// Get all fundings
export const getFundings = async () => {
  const response = await axiosClient.get('/funding/fundings/');
  return response.data;
};

// Create funding
export const createFunding = async (fundingData) => {
  const response = await axiosClient.post('/funding/fundings/', fundingData);
  return response.data;
};

// Get single funding
export const getFunding = async (id) => {
  const response = await axiosClient.get(`/funding/fundings/${id}/`);
  return response.data;
};

// Update funding
export const updateFunding = async (id, fundingData) => {
  const response = await axiosClient.put(`/funding/fundings/${id}/`, fundingData);
  return response.data;
};

// Delete funding
export const deleteFunding = async (id) => {
  const response = await axiosClient.delete(`/funding/fundings/${id}/`);
  return response.data;
};