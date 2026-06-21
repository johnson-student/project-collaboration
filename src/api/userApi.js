import axiosClient from "./axios.js";

export const userApi = {
  getUsers: (params) => axiosClient.get("/users", { params }),
  getUserById: (id) => axiosClient.get(`/users/${id}`),
  updateUser: (id, data) => axiosClient.put(`/users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
  updateAvatar: (id, formData) =>
    axiosClient.post(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  searchUsers: (query) => axiosClient.get("/users/search", { params: { q: query } }),
};
