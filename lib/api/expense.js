import axiosClient from './axiosClient';

// ✅ GET: jangan terima params langsung
export const getExpenses = async () => {
  const response = await axiosClient.get('/api/expense/');
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
