import axiosClient from './axiosClient';

export const getFinancialReport = async () => {
  const response = await axiosClient.get('/api/reporting/laporan-keuangan/');
  return response.data;
};