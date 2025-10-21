import axiosClient from './axiosClient';

// Get all productions
export const getProductions = async () => {
  const response = await axiosClient.get('/api/production/productions/');
  return response.data;
};

// Create production
export const createProduction = async (productionData) => {
  const response = await axiosClient.post('/api/production/productions/', productionData);
  return response.data;
};

// Get single production
export const getProduction = async (id) => {
  const response = await axiosClient.get(`/api/production/productions/${id}/`);
  return response.data;
};

// Update production (full)
export const updateProduction = async (id, productionData) => {
  const response = await axiosClient.put(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

// Partial update production
export const patchProduction = async (id, productionData) => {
  const response = await axiosClient.patch(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

// Delete production
export const deleteProduction = async (id) => {
  const response = await axiosClient.delete(`/api/production/productions/${id}/`);
  return response.data;
};