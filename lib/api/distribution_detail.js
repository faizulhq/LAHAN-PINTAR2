import axiosClient from './axiosClient';

// Get all distribution details
export const getDistributionDetails = async () => {
  const response = await axiosClient.get('/distributiondetail/distributiondetails/');
  return response.data;
};

// Create distribution detail
export const createDistributionDetail = async (distributionDetailData) => {
  const response = await axiosClient.post('/distributiondetail/distributiondetails/', distributionDetailData);
  return response.data;
};

// Get single distribution detail
export const getDistributionDetail = async (id) => {
  const response = await axiosClient.get(`/distributiondetail/distributiondetails/${id}/`);
  return response.data;
};

// Update distribution detail
export const updateDistributionDetail = async (id, distributionDetailData) => {
  const response = await axiosClient.put(`/distributiondetail/distributiondetails/${id}/`, distributionDetailData);
  return response.data;
};

// Delete distribution detail
export const deleteDistributionDetail = async (id) => {
  const response = await axiosClient.delete(`/distributiondetail/distributiondetails/${id}/`);
  return response.data;
};