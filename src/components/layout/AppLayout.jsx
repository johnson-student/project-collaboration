import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import { selectSidebarOpen, selectDarkMode, toggleSidebar } from "../../features/ui/uiSlice.js";
import { connectSocket, disconnectSocket } from "../../api/socket.js";

export default function AppLayout() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const darkMode = useSelector(selectDarkMode);

  // Keep <html> class in sync with Redux state
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Connect the real-time socket while the user is in the app shell,
  // disconnect when they leave (logout navigates out of this layout).
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  const handleMenuClick = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarOpen ? "260px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col min-h-screen"
      >
        <Navbar onMenuClick={handleMenuClick} />
        <main className="flex-1 pt-16 p-6">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
