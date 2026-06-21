import axiosClient from "./axios.js";

export const authApi = {
  login: (credentials) => axiosClient.post("/auth/login", credentials),
  register: (data) => axiosClient.post("/auth/register", data),
  logout: () => axiosClient.post("/auth/logout"),
  refreshToken: () => axiosClient.post("/auth/refresh"),
  getMe: () => axiosClient.get("/auth/me"),
  forgotPassword: (email) => axiosClient.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    axiosClient.post("/auth/reset-password", { token, password }),
};
