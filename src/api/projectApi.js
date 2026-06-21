import axiosClient from "./axios.js";

export const projectApi = {
  getProjects: (params) => axiosClient.get("/projects", { params }),
  getProjectById: (id) => axiosClient.get(`/projects/${id}`),
  createProject: (data) => axiosClient.post("/projects", data),
  updateProject: (id, data) => axiosClient.put(`/projects/${id}`, data),
  deleteProject: (id) => axiosClient.delete(`/projects/${id}`),
  getProjectMembers: (id) => axiosClient.get(`/projects/${id}/members`),
  addProjectMember: (id, userId) =>
    axiosClient.post(`/projects/${id}/members`, { userId }),
  removeProjectMember: (id, userId) =>
    axiosClient.delete(`/projects/${id}/members/${userId}`),
  getProjectStats: (id) => axiosClient.get(`/projects/${id}/stats`),
};
