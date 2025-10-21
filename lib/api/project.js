import axiosClient from './axiosClient';

// Get all projects
export const getProjects = async () => {
  const response = await axiosClient.get('/projects/');
  return response.data;
};

// Create project
export const createProject = async (projectData) => {
  const response = await axiosClient.post('/projectss/tambah/', projectData);
  return response.data;
};

// Get single project
export const getProject = async (id) => {
  const response = await axiosClient.get(`/projectsss/${id}`);
  return response.data;
};

// Update project
export const updateProject = async (id, projectData) => {
  const response = await axiosClient.put(`/projectsss/${id}`, projectData);
  return response.data;
};

// Delete project
export const deleteProject = async (id) => {
  const response = await axiosClient.delete(`/projectsss/${id}`);
  return response.data;
};