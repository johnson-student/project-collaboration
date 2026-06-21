import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const activityApiSlice = createApi({
  reducerPath: "activityApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Activity"],
  endpoints: (b) => ({
    getProjectActivity: b.query({
      query: ({ projectId, limit = 50 }) => `/projects/${projectId}/activity?limit=${limit}`,
      transformResponse: (r) => r.data ?? [],
      providesTags: (_, __, { projectId }) => [{ type: "Activity", id: projectId }],
    }),
  }),
});

export const { useGetProjectActivityQuery } = activityApiSlice;
