import axiosClient from './axiosClient';

// Ambil Daftar Aset
export const getAssets = async (params) => {
  const response = await axiosClient.get('/api/asset/aset/', { params });
  return response.data;
};

// Buat Aset Baru
// PERBAIKAN: Cek apakah data FormData atau JSON
export const createAsset = async (data) => {
  const isFormData = data instanceof FormData;
  
  const response = await axiosClient.post('/api/asset/aset/', data, {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
  });
  return response.data;
};

// Update Aset
export const updateAsset = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await axiosClient.put(`/api/asset/aset/${id}/`, data, {
    headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    }
  });
  return response.data;
};

// Hapus Aset
export const deleteAsset = async (id) => {
  const response = await axiosClient.delete(`/api/asset/aset/${id}/`);
  return response.data;
};

export const getAsset = async (id) => {
  const response = await axiosClient.get(`/api/asset/aset/${id}/`);
  return response.data;
};