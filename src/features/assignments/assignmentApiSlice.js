import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const assignmentApiSlice = createApi({
  reducerPath: "assignmentApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AssignmentRequest"],
  endpoints: (b) => ({
    getMyAssignmentRequests: b.query({
      query: () => "/requests/assignments/my",
      transformResponse: (r) => r.data ?? [],
      providesTags: [{ type: "AssignmentRequest", id: "LIST" }],
    }),
    respondToAssignment: b.mutation({
      query: ({ id, action }) => ({ url: `/requests/assignments/${id}/respond`, method: "PATCH", body: { action } }),
      invalidatesTags: [{ type: "AssignmentRequest", id: "LIST" }],
    }),
    createAssignmentRequest: b.mutation({
      query: ({ taskId, assigneeId }) => ({ url: `/tasks/${taskId}/assignment-request`, method: "POST", body: { assigneeId } }),
    }),
    getTaskAssignmentRequests: b.query({
      query: (taskId) => `/tasks/${taskId}/assignment-requests`,
      transformResponse: (r) => r.data ?? [],
    }),
  }),
});

export const {
  useGetMyAssignmentRequestsQuery, useRespondToAssignmentMutation,
  useCreateAssignmentRequestMutation, useGetTaskAssignmentRequestsQuery,
} = assignmentApiSlice;
