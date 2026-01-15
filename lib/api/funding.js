import axiosClient from './axiosClient';

// PERBAIKAN: Hapus /fundings/ di akhir
export const getFundings = async (params) => {
  const response = await axiosClient.get('/api/funding/', { params });
  return response.data;
};

export const createFunding = async (fundingData) => {
  const response = await axiosClient.post('/api/funding/', fundingData);
  return response.data;
};

export const updateFunding = async ({ id, fundingData }) => {
  const response = await axiosClient.put(`/api/funding/${id}/`, fundingData);
  return response.data;
};

export const deleteFunding = async (id) => {
  const response = await axiosClient.delete(`/api/funding/${id}/`);
  return response.data;
};