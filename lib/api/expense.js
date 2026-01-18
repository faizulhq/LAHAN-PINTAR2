import axiosClient from './axiosClient';

// PERBAIKAN: Hapus /expenses/ di akhir
export const getExpenses = async (params) => {
  const response = await axiosClient.get('/api/expense/', { params });
  return response.data;
};

export const createExpense = async (data) => {
  const response = await axiosClient.post('/api/expense/', data);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await axiosClient.put(`/api/expense/${id}/`, data);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await axiosClient.delete(`/api/expense/${id}/`);
  return response.data;
};