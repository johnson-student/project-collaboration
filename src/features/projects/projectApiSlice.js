import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const projectApiSlice = createApi({
  reducerPath: "projectApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Project", "ProjectMember", "ProjectStats"],
  endpoints: (b) => ({
    getProjects:         b.query({ query: (p={}) => ({ url:"/projects", params:p }), transformResponse:(r)=>r,
                           providesTags:(r)=>r?.data?[...r.data.map(({id})=>({type:"Project",id})),{type:"Project",id:"LIST"}]:[{type:"Project",id:"LIST"}] }),
    getProjectById:      b.query({ query:(id)=>`/projects/${id}`, transformResponse:(r)=>r.data, providesTags:(_,__,id)=>[{type:"Project",id}] }),
    createProject:       b.mutation({ query:(body)=>({ url:"/projects",method:"POST",body }), transformResponse:(r)=>r.data, invalidatesTags:[{type:"Project",id:"LIST"}] }),
    updateProject:       b.mutation({ query:({id,...body})=>({ url:`/projects/${id}`,method:"PUT",body }), transformResponse:(r)=>r.data,
                           invalidatesTags:(_,__,{id})=>[{type:"Project",id},{type:"Project",id:"LIST"}] }),
    deleteProject:       b.mutation({ query:(id)=>({ url:`/projects/${id}`,method:"DELETE" }), invalidatesTags:[{type:"Project",id:"LIST"}] }),
    getProjectStats:     b.query({ query:(id)=>`/projects/${id}/stats`, transformResponse:(r)=>r.data, providesTags:(_,__,id)=>[{type:"ProjectStats",id}] }),
    getProjectMembers:   b.query({ query:(id)=>`/projects/${id}/members`, transformResponse:(r)=>r.data, providesTags:(_,__,id)=>[{type:"ProjectMember",id}] }),
    // Keep addProjectMember for backward compat (createProject flow uses it internally)
    addProjectMember:    b.mutation({ query:({projectId,...body})=>({ url:`/projects/${projectId}/members`,method:"POST",body }),
                           invalidatesTags:(_,__,{projectId})=>[{type:"ProjectMember",id:projectId},{type:"Project",id:projectId}] }),
    removeProjectMember: b.mutation({ query:({projectId,userId})=>({ url:`/projects/${projectId}/members/${userId}`,method:"DELETE" }),
                           invalidatesTags:(_,__,{projectId})=>[{type:"ProjectMember",id:projectId},{type:"Project",id:projectId}] }),
  }),
});

export const {
  useGetProjectsQuery, useGetProjectByIdQuery,
  useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation,
  useGetProjectStatsQuery, useGetProjectMembersQuery,
  useAddProjectMemberMutation, useRemoveProjectMemberMutation,
} = projectApiSlice;
