import axiosClient from "./axios.js";

export const notificationApi = {
  getNotifications: () => axiosClient.get("/notifications"),
  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch("/notifications/read-all"),
  deleteNotification: (id) => axiosClient.delete(`/notifications/${id}`),
  getUnreadCount: () => axiosClient.get("/notifications/unread-count"),
};
