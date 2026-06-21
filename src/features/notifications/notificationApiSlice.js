import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const notificationApiSlice = createApi({
  reducerPath: "notificationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notification"],
  endpoints: (b) => ({
    getNotifications: b.query({
      query: (p = {}) => ({ url: "/notifications", params: p }),
      transformResponse: (r) => r.data ?? r,
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAsRead: b.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllRead: b.mutation({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    deleteNotification: b.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery, useMarkAsReadMutation,
  useMarkAllReadMutation, useDeleteNotificationMutation,
} = notificationApiSlice;
