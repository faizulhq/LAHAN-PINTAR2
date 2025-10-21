import axiosClient from './axiosClient';

export const getDashboardData = async () => {
  const response = await axiosClient.get('/api/dashboard/dashboards/');
  return response.data;
};