import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const fileApiSlice = createApi({
  reducerPath: "fileApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ProjectFile"],
  endpoints: (b) => ({
    getProjectFiles: b.query({
      query: (projectId) => `/projects/${projectId}/files`,
      transformResponse: (r) => r.data ?? [],
      providesTags: (_, __, projectId) => [{ type: "ProjectFile", id: projectId }],
    }),
    uploadProjectFile: b.mutation({
      queryFn: async ({ projectId, file }, _api, _extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append("file", file);
        return baseQuery({ url: `/projects/${projectId}/files`, method: "POST", body: formData });
      },
      invalidatesTags: (_, __, { projectId }) => [{ type: "ProjectFile", id: projectId }, { type: "Activity", id: projectId }],
    }),
    deleteProjectFile: b.mutation({
      query: ({ projectId, fileId }) => ({ url: `/projects/${projectId}/files/${fileId}`, method: "DELETE" }),
      invalidatesTags: (_, __, { projectId }) => [{ type: "ProjectFile", id: projectId }],
    }),
  }),
});

export const { useGetProjectFilesQuery, useUploadProjectFileMutation, useDeleteProjectFileMutation } = fileApiSlice;
