import { configureStore } from "@reduxjs/toolkit";
import authReducer               from "../features/auth/authSlice";
import { authApiSlice }          from "../features/auth/authApiSlice";
import { projectApiSlice }       from "../features/projects/projectApiSlice";
import { taskApiSlice }          from "../features/tasks/taskApiSlice";
import { userApiSlice }          from "../features/users/userApiSlice";
import { notificationApiSlice }  from "../features/notifications/notificationApiSlice";
import { invitationApiSlice }    from "../features/invitations/invitationApiSlice";
import { assignmentApiSlice }    from "../features/assignments/assignmentApiSlice";
import { fileApiSlice }          from "../features/files/fileApiSlice";
import { activityApiSlice }      from "../features/activity/activityApiSlice";
import { chatApiSlice }          from "../features/chat/chatApiSlice";
import uiReducer                 from "../features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    auth:                              authReducer,
    [authApiSlice.reducerPath]:         authApiSlice.reducer,
    [projectApiSlice.reducerPath]:      projectApiSlice.reducer,
    [taskApiSlice.reducerPath]:         taskApiSlice.reducer,
    [userApiSlice.reducerPath]:         userApiSlice.reducer,
    [notificationApiSlice.reducerPath]: notificationApiSlice.reducer,
    [invitationApiSlice.reducerPath]:   invitationApiSlice.reducer,
    [assignmentApiSlice.reducerPath]:   assignmentApiSlice.reducer,
    [fileApiSlice.reducerPath]:         fileApiSlice.reducer,
    [activityApiSlice.reducerPath]:     activityApiSlice.reducer,
    [chatApiSlice.reducerPath]:         chatApiSlice.reducer,
    ui:                                uiReducer,
  },
  middleware: (gDM) =>
    gDM().concat(
      authApiSlice.middleware,
      projectApiSlice.middleware,
      taskApiSlice.middleware,
      userApiSlice.middleware,
      notificationApiSlice.middleware,
      invitationApiSlice.middleware,
      assignmentApiSlice.middleware,
      fileApiSlice.middleware,
      activityApiSlice.middleware,
      chatApiSlice.middleware,
    ),
});
