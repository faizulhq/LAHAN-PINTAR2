import axiosClient from './axiosClient';

// Get all expenses
export const getExpenses = async () => {
  const response = await axiosClient.get('/api/expense/expenses/');
  return response.data;
};

// Create expense
export const createExpense = async (expenseData) => {
  const response = await axiosClient.post('/api/expense/expenses/', expenseData);
  return response.data;
};

// Get single expense
export const getExpense = async (id) => {
  const response = await axiosClient.get(`/api/expense/expenses/${id}/`);
  return response.data;
};

// Update expense
export const updateExpense = async (id, expenseData) => {
  const response = await axiosClient.put(`/api/expense/expenses/${id}/`, expenseData);
  return response.data;
};

// Delete expense
export const deleteExpense = async (id) => {
  const response = await axiosClient.delete(`/api/expense/expenses/${id}/`);
  return response.data;
};