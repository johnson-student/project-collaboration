import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const chatApiSlice = createApi({
  reducerPath: "chatApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Message"],
  endpoints: (b) => ({
    getProjectMessages: b.query({
      query: ({ projectId, before, limit = 50 }) => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (before) params.set("before", String(before));
        return `/projects/${projectId}/messages?${params.toString()}`;
      },
      transformResponse: (r) => r.data ?? [],
      providesTags: (_, __, { projectId }) => [{ type: "Message", id: projectId }],
    }),
    sendMessage: b.mutation({
      query: ({ projectId, body, file }) => {
        if (file) {
          const formData = new FormData();
          if (body) formData.append("body", body);
          formData.append("file", file);
          return { url: `/projects/${projectId}/messages`, method: "POST", body: formData };
        }
        return { url: `/projects/${projectId}/messages`, method: "POST", body: { body } };
      },
      transformResponse: (r) => r.data,
      // No invalidation — the socket "chat:message" event drives the UI update,
      // since the REST response and the broadcast both arrive to the sender.
    }),
    editMessage: b.mutation({
      query: ({ projectId, messageId, body }) => ({
        url: `/projects/${projectId}/messages/${messageId}`,
        method: "PUT",
        body: { body },
      }),
      transformResponse: (r) => r.data,
    }),
    deleteMessage: b.mutation({
      query: ({ projectId, messageId }) => ({
        url: `/projects/${projectId}/messages/${messageId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetProjectMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} = chatApiSlice;
