import axiosClient from './axiosClient';

// Get all assets
export const getAssets = async () => {
  const response = await axiosClient.get('/Aset/');
  return response.data;
};

// Create asset
export const createAsset = async (assetData) => {
  const response = await axiosClient.post('/aset/tambah', assetData);
  return response.data;
};

// Get single asset
export const getAsset = async (id) => {
  const response = await axiosClient.get(`/asset/${id}/`);
  return response.data;
};

// Update asset
export const updateAsset = async (id, assetData) => {
  const response = await axiosClient.put(`/asset/${id}/`, assetData);
  return response.data;
};

// Delete asset
export const deleteAsset = async (id) => {
  const response = await axiosClient.delete(`/asset/${id}/`);
  return response.data;
};

// ========== OWNER ENDPOINTS ==========

// Get all owners
export const getOwners = async () => {
  const response = await axiosClient.get('/owner/');
  return response.data;
};

// Create owner
export const createOwner = async (ownerData) => {
  const response = await axiosClient.post('/owner/tambah', ownerData);
  return response.data;
};

// Get single owner
export const getOwner = async (id) => {
  const response = await axiosClient.get(`/owner/${id}/`);
  return response.data;
};

// Update owner
export const updateOwner = async (id, ownerData) => {
  const response = await axiosClient.put(`/owner/${id}/`, ownerData);
  return response.data;
};

// Delete owner
export const deleteOwner = async (id) => {
  const response = await axiosClient.delete(`/owner/${id}/`);
  return response.data;
};