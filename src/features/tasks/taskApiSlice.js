import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseQueryWithReauth.js';

export const taskApiSlice = createApi({
  reducerPath: 'taskApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task'],
  endpoints: (b) => ({
    getTasks: b.query({
      query: (p = {}) => ({ url: '/tasks', params: p }),
      transformResponse: (r) => r,
      providesTags: (r) =>
        r?.data
          ? [
              ...r.data.map(({ id }) => ({ type: 'Task', id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTasksByProject: b.query({
      query: (projectId) => ({ url: '/tasks', params: { projectId } }),
      transformResponse: (r) => r,
      providesTags: (r) =>
        r?.data
          ? [
              ...r.data.map(({ id }) => ({ type: 'Task', id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTaskById: b.query({
      query: (id) => `/tasks/${id}`,
      transformResponse: (r) => r.data,
      providesTags: (_, __, id) => [{ type: 'Task', id }],
    }),
    createTask: b.mutation({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      transformResponse: (r) => r.data,
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    deleteTask: b.mutation({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    moveTask: b.mutation({
      query: ({ id, status, completeSubtasks }) => ({
        url: `/tasks/${id}/status`,
        method: 'PATCH',
        body: { status, completeSubtasks },
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
      // Update every cached task-list variant (Kanban, project tasks tab, dashboard, …)
      // immediately, so the card moves on drop instead of waiting on the round trip.
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const patches = taskApiSlice.util
          .selectCachedArgsForQuery(getState(), 'getTasks')
          .map((arg) =>
            dispatch(
              taskApiSlice.util.updateQueryData('getTasks', arg, (draft) => {
                const list = Array.isArray(draft) ? draft : draft?.data;
                const task = list?.find((t) => t.id === id);
                if (task) task.status = status;
              })
            )
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),
    assignTask: b.mutation({
      query: ({ id, userId }) => ({
        url: `/tasks/${id}/assign`,
        method: 'PATCH',
        body: { userId },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Task', id }],
    }),
    // Comments
    addComment: b.mutation({
      query: ({ taskId, comment }) => ({
        url: `/tasks/${taskId}/comments`,
        method: 'POST',
        body: { comment },
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    editComment: b.mutation({
      query: ({ taskId, commentId, comment }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: 'PUT',
        body: { comment },
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    deleteComment: b.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    // Subtasks
    getSubtasks: b.query({
      query: (taskId) => `/tasks/${taskId}/subtasks`,
      transformResponse: (r) => r,
      providesTags: (_, __, taskId) => [{ type: 'Task', id: taskId }],
    }),
    createSubtask: b.mutation({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/subtasks`,
        method: 'POST',
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    updateSubtask: b.mutation({
      query: ({ taskId, subtaskId, ...body }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    deleteSubtask: b.mutation({
      query: ({ taskId, subtaskId }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    updateSubtaskStatus: b.mutation({
      query: ({ taskId, subtaskId, status }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    reorderSubtasks: b.mutation({
      query: ({ taskId, order }) => ({
        url: `/tasks/${taskId}/subtasks/reorder`,
        method: 'PATCH',
        body: { order },
      }),
      invalidatesTags: (_, __, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useAssignTaskMutation,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
  useGetSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useUpdateSubtaskStatusMutation,
  useReorderSubtasksMutation,
} = taskApiSlice;
