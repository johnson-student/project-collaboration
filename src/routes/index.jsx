import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import ProtectedRoute  from "../components/layout/ProtectedRoute";
import AppLayout       from "../components/layout/AppLayout";
import Login           from "../pages/Auth/Login";
import Register        from "../pages/Auth/Register";
import ForgotPassword  from "../pages/Auth/ForgotPassword";
import Dashboard       from "../pages/Dashboard";
import Projects        from "../pages/Projects";
import ProjectDetails  from "../pages/Projects/ProjectDetails";
import Tasks           from "../pages/Tasks";
import Kanban          from "../pages/Kanban";
import TeamMembers     from "../pages/TeamMembers";
import Profile         from "../pages/Profile";
import Settings        from "../pages/Settings";
import Requests        from "../pages/Requests";

const router = createBrowserRouter([
  { path: "/login",           element: <Login /> },
  { path: "/register",        element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true,             element: <Dashboard /> },
      { path: "projects",        element: <Projects /> },
      { path: "projects/:id",    element: <ProjectDetails /> },
      { path: "tasks",           element: <Tasks /> },
      { path: "kanban",          element: <Kanban /> },
      { path: "team",            element: <TeamMembers /> },
      { path: "requests",        element: <Requests /> },
      { path: "profile",         element: <Profile /> },
      { path: "settings",        element: <Settings /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
