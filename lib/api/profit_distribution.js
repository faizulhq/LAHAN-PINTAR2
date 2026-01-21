import axiosClient from './axiosClient';

export const getDistributions = async () => {
  const response = await axiosClient.get('/api/profit-distribution/');
  return response.data;
};

// [FIX] Update fungsi ini
export const previewDistribution = async (amount) => {
  // Kita bungkus amount menjadi object sesuai ekspektasi backend
  // Backend mengharapkan field 'total_distributed' atau 'total_amount' sesuai logic view
  const payload = {
    total_distributed: amount,
    // Tambahkan date default hari ini jika backend validasi tanggal
    date: new Date().toISOString().split('T')[0] 
  };
  
  const response = await axiosClient.post('/api/profit-distribution/preview/', payload);
  return response.data;
};

export const createDistribution = async (data) => {
  const response = await axiosClient.post('/api/profit-distribution/', data);
  return response.data;
};

export const deleteDistribution = async (id) => {
  const response = await axiosClient.delete(`/api/profit-distribution/${id}/`);
  return response.data;
};