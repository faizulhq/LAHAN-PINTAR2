import axiosClient from './axiosClient';

// Get all projects
export const getProjects = async () => {
  const response = await axiosClient.get('/api/project/projects/');
  return response.data;
};

// Create project
export const createProject = async (projectData) => {
  const response = await axiosClient.post('/api/project/projects/tambah/', projectData);
  return response.data;
};

// Get single project
export const getProject = async (id) => {
  const response = await axiosClient.get(`/api/project/projects/${id}/`);
  return response.data;
};

// Update project
export const updateProject = async (id, projectData) => {
  const response = await axiosClient.put(`/api/project/projects/${id}/`, projectData);
  return response.data;
};

// Delete project
export const deleteProject = async (id) => {
  const response = await axiosClient.delete(`/api/project/projects/${id}/`);
  return response.data;
};