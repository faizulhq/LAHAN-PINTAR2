import axiosClient from './axiosClient';

export const getProductions = async (params) => {
  const response = await axiosClient.get('/api/production/productions/', { params });
  return response.data;
};

export const createProduction = async (productionData) => {
  const response = await axiosClient.post('/api/production/productions/', productionData);
  return response.data;
};

export const getProduction = async (id) => {
  const response = await axiosClient.get(`/api/production/productions/${id}/`);
  return response.data;
};

export const updateProduction = async (id, productionData) => {
  const response = await axiosClient.put(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

export const patchProduction = async (id, productionData) => {
  const response = await axiosClient.patch(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

export const deleteProduction = async (id) => {
  const response = await axiosClient.delete(`/api/production/productions/${id}/`);
  return response.data;
};