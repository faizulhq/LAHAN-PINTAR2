import axiosClient from './axiosClient';

// Ambil Daftar
export const getExpenses = async (params) => {
  const response = await axiosClient.get('/api/expense/expenses/', { params });
  return response.data;
};

// [PENTING] Ambil Detail (Ini yang menyebabkan error di console jika tidak ada)
export const getExpense = async (id) => {
  const response = await axiosClient.get(`/api/expense/expenses/${id}/`);
  return response.data;
};

// Create
export const createExpense = async (data) => {
  const response = await axiosClient.post('/api/expense/expenses/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }, // Support upload file
  });
  return response.data;
};

// Update
export const updateExpense = async (id, data) => {
  const response = await axiosClient.put(`/api/expense/expenses/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Delete
export const deleteExpense = async (id) => {
  const response = await axiosClient.delete(`/api/expense/expenses/${id}/`);
  return response.data;
};