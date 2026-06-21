import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import { selectSidebarOpen, toggleSidebar } from "../../features/ui/uiSlice.js";
import { resolveAssetUrl } from "../../utils/helpers.js";

const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Projects",
    path: "/projects",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path d="M3 7a2 2 0 0 1 2-2h3l2 3h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Kanban",
    path: "/kanban",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <rect x="3" y="3" width="5" height="18" rx="1.5" />
        <rect x="10" y="3" width="5" height="12" rx="1.5" />
        <rect x="17" y="3" width="5" height="15" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Team",
    path: "/team",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    label: "Requests",
    path: "/requests",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: "Profile",
    path: "/profile",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const user = useSelector(selectCurrentUser);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -260, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-screen w-65 z-40 flex flex-col"
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #0d1424 100%)",
            borderRight: "1px solid rgba(99,102,241,0.12)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                CF
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm tracking-wide">
                  CollabFlow
                </p>
                <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                  Workspace
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                className="text-current"
              >
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
              Navigation
            </p>
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === "/"}>
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-brand-500/15 text-brand-300"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={isActive ? "text-brand-400" : "text-slate-500"}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {isActive && (
                      <div
                        className="ml-auto w-1 h-4 rounded-full"
                        style={{
                          background:
                            "linear-gradient(180deg, #6366f1, #8b5cf6)",
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-0.5">
            {bottomItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-brand-500/15 text-brand-300"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={isActive ? "text-brand-400" : "text-slate-500"}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}

            {/* User profile card */}
            <div className="mt-3 px-3 py-3 rounded-xl bg-white/4 border border-white/6 flex items-center gap-3">

              {user?.avatar ? <img src={resolveAssetUrl(user.avatar)} alt={user.name} className="navbar-avatar-img" /> : (<div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: user?.color || "#6366f1" }}
              >
                {user?.initials}
              </div>)}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
