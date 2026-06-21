import axiosClient from "./axios.js";

export const taskApi = {
  getTasks: (params) => axiosClient.get("/tasks", { params }),
  getTaskById: (id) => axiosClient.get(`/tasks/${id}`),
  createTask: (data) => axiosClient.post("/tasks", data),
  updateTask: (id, data) => axiosClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => axiosClient.delete(`/tasks/${id}`),
  moveTask: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),
  assignTask: (id, userId) =>
    axiosClient.patch(`/tasks/${id}/assign`, { userId }),
  getTasksByProject: (projectId) =>
    axiosClient.get(`/projects/${projectId}/tasks`),
  addComment: (id, comment) =>
    axiosClient.post(`/tasks/${id}/comments`, { comment }),
};
