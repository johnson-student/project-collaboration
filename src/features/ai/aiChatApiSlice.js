import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseQueryWithReauth.js';
import { projectApiSlice } from '../projects/projectApiSlice.js';
import { taskApiSlice } from '../tasks/taskApiSlice.js';

export const aiChatApiSlice = createApi({
  reducerPath: 'aiChatApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AiChat'],
  endpoints: (b) => ({
    getAiMessages: b.query({
      query: (projectId) => `/projects/${projectId}/ai/messages`,
      transformResponse: (r) => r.data,
      providesTags: (_, __, projectId) => [{ type: 'AiChat', id: projectId }],
    }),
    sendAiMessage: b.mutation({
      query: ({ projectId, message }) => ({
        url: `/projects/${projectId}/ai/chat`,
        method: 'POST',
        body: { message },
      }),
      transformResponse: (r) => r.data,
      // Append the returned user+assistant pair directly instead of
      // refetching the whole history.
      async onQueryStarted({ projectId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            aiChatApiSlice.util.updateQueryData('getAiMessages', projectId, (draft) => {
              draft.push(...(data?.messages ?? []));
            }),
          );
          // The AI can change data via tools — refresh the affected caches
          for (const action of data?.actions ?? []) {
            if (action.tool === 'update_project') {
              dispatch(
                projectApiSlice.util.invalidateTags([
                  { type: 'Project', id: projectId },
                  { type: 'Project', id: 'LIST' },
                ]),
              );
            }
            if (action.tool === 'create_subtasks' || action.tool === 'assign_task') {
              dispatch(
                taskApiSlice.util.invalidateTags([
                  { type: 'Task', id: action.taskId },
                  { type: 'Task', id: 'LIST' },
                ]),
              );
            }
          }
        } catch {
          /* error surfaced by the component */
        }
      },
    }),
    clearAiChat: b.mutation({
      query: (projectId) => ({
        url: `/projects/${projectId}/ai/messages`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, projectId) => [{ type: 'AiChat', id: projectId }],
    }),
  }),
});

export const {
  useGetAiMessagesQuery,
  useSendAiMessageMutation,
  useClearAiChatMutation,
} = aiChatApiSlice;
