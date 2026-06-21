import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const userApiSlice = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (b) => ({
    getUsers: b.query({
      query: (p = {}) => ({ url: "/users", params: p }),
      transformResponse: (r) => r,
      providesTags: [{ type: "User", id: "LIST" }],
    }),
    searchUsers: b.query({
      query: ({ q = "", projectId, scope } = {}) => ({
        url: "/users/search",
        params: {
          q,
          ...(scope ? { scope } : {}),
          ...(projectId ? { projectId: Number(projectId) } : {}),
        },
        headers: { "Cache-Control": "no-cache" },
      }),
      transformResponse: (r) => r.data ?? r,
    }),
    getUserById: b.query({
      query: (id) => `/users/${id}`,
      transformResponse: (r) => r.data,
      providesTags: (_, __, id) => [{ type: "User", id }],
    }),
    updateUser: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    updateAvatar: b.mutation({
      query: ({ id, formData }) => ({
        url: `/users/${id}/avatar`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "User", id }],
    }),
    deleteUser: b.mutation({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useSearchUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateAvatarMutation,
  useDeleteUserMutation,
} = userApiSlice;
