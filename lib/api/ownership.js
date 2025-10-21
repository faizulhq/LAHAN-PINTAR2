import axiosClient from './axiosClient';

// Get all ownerships
export const getOwnerships = async () => {
  const response = await axiosClient.get('/api/ownership/ownerships/');
  return response.data;
};

// Create ownership
export const createOwnership = async (ownershipData) => {
  const response = await axiosClient.post('/api/ownership/ownerships/', ownershipData);
  return response.data;
};

// Get single ownership
export const getOwnership = async (id) => {
  const response = await axiosClient.get(`/api/ownership/ownerships/${id}/`);
  return response.data;
};

// Update ownership
export const updateOwnership = async (id, ownershipData) => {
  const response = await axiosClient.put(`/api/ownership/ownerships/${id}/`, ownershipData);
  return response.data;
};

// Delete ownership
export const deleteOwnership = async (id) => {
  const response = await axiosClient.delete(`/api/ownership/ownerships/${id}/`);
  return response.data;
};