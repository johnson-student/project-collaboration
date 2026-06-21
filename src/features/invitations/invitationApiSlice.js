import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const invitationApiSlice = createApi({
  reducerPath: "invitationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Invitation", "ProjectInvitation"],
  endpoints: (b) => ({
    getMyInvitations: b.query({
      query: () => "/invitations/my",
      transformResponse: (r) => r.data ?? [],
      providesTags: [{ type: "Invitation", id: "LIST" }],
    }),
    respondToInvitation: b.mutation({
      query: ({ id, action }) => ({ url: `/invitations/${id}/respond`, method: "PATCH", body: { action } }),
      invalidatesTags: [{ type: "Invitation", id: "LIST" }],
    }),
    getProjectInvitations: b.query({
      query: (projectId) => `/projects/${projectId}/invitations`,
      transformResponse: (r) => r.data ?? [],
      providesTags: (_, __, projectId) => [{ type: "ProjectInvitation", id: projectId }],
    }),
    createInvitation: b.mutation({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/invitations`, method: "POST", body }),
      invalidatesTags: (_, __, { projectId }) => [{ type: "ProjectInvitation", id: projectId }],
    }),
    cancelInvitation: b.mutation({
      query: ({ projectId, invitationId }) => ({ url: `/projects/${projectId}/invitations/${invitationId}`, method: "DELETE" }),
      invalidatesTags: (_, __, { projectId }) => [{ type: "ProjectInvitation", id: projectId }],
    }),
  }),
});

export const {
  useGetMyInvitationsQuery, useRespondToInvitationMutation,
  useGetProjectInvitationsQuery, useCreateInvitationMutation, useCancelInvitationMutation,
} = invitationApiSlice;
