import axiosClient from './axiosClient';

// Get all productions
export const getProductions = async () => {
  const response = await axiosClient.get('/production/productions/');
  return response.data;
};

// Create production
export const createProduction = async (productionData) => {
  const response = await axiosClient.post('/production/productions/', productionData);
  return response.data;
};

// Get single production
export const getProduction = async (id) => {
  const response = await axiosClient.get(`/production/productions/${id}/`);
  return response.data;
};

// Update production (full)
export const updateProduction = async (id, productionData) => {
  const response = await axiosClient.put(`/production/productions/${id}/`, productionData);
  return response.data;
};

// Partial update production
export const patchProduction = async (id, productionData) => {
  const response = await axiosClient.patch(`/production/productions/${id}/`, productionData);
  return response.data;
};

// Delete production
export const deleteProduction = async (id) => {
  const response = await axiosClient.delete(`/production/productions/${id}/`);
  return response.data;
};