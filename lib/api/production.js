// faizulhq/lahan-pintar2/LAHAN-PINTAR2-master/lib/api/production.js

import axiosClient from './axiosClient';

// --- MODIFIKASI DI SINI ---
// Get all productions (sekarang menerima params)
export const getProductions = async (params) => {
  // params akan berisi: { asset, search, type, status }
  const response = await axiosClient.get('/api/production/productions/', { params });
  return response.data;
};
// --- BATAS MODIFIKASI ---

// Create production
export const createProduction = async (productionData) => {
  const response = await axiosClient.post('/api/production/productions/', productionData);
  return response.data;
};

// Get single production (untuk modal detail)
export const getProduction = async (id) => {
  const response = await axiosClient.get(`/api/production/productions/${id}/`);
  return response.data;
};

// Update production (full)
export const updateProduction = async (id, productionData) => {
  const response = await axiosClient.put(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

// Partial update production (digunakan di file lama)
export const patchProduction = async (id, productionData) => {
  const response = await axiosClient.patch(`/api/production/productions/${id}/`, productionData);
  return response.data;
};

// Delete production
export const deleteProduction = async (id) => {
  const response = await axiosClient.delete(`/api/production/productions/${id}/`);
  return response.data;
};