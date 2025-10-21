import axiosClient from './axiosClient';

// Get all investors
export const getInvestors = async () => {
  const response = await axiosClient.get('/investor/investors/');
  return response.data;
};

// Create investor
export const createInvestor = async (investorData) => {
  const response = await axiosClient.post('/investor/investors/', investorData);
  return response.data;
};

// Get single investor
export const getInvestor = async (id) => {
  const response = await axiosClient.get(`/investor/investors/${id}/`);
  return response.data;
};

// Update investor
export const updateInvestor = async (id, investorData) => {
  const response = await axiosClient.put(`/investor/investors/${id}/`, investorData);
  return response.data;
};

// Delete investor
export const deleteInvestor = async (id) => {
  const response = await axiosClient.delete(`/investor/investors/${id}/`);
  return response.data;
};