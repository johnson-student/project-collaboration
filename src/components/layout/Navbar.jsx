import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { selectCurrentUser, logout as logoutAction } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../features/auth/authApiSlice";
import { useGetNotificationsQuery, useMarkAllReadMutation, useMarkAsReadMutation } from "../../features/notifications/notificationApiSlice";
import { useRespondToInvitationMutation } from "../../features/invitations/invitationApiSlice.js";
import { useRespondToAssignmentMutation } from "../../features/assignments/assignmentApiSlice.js";
import { selectSidebarOpen } from "../../features/ui/uiSlice.js";
import { resolveAssetUrl } from "../../utils/helpers.js";
import { useToast } from "../common/Toast.jsx";
import { disconnectSocket, getSocket } from "../../api/socket.js";
import { Icon } from "../common/icons.jsx";

export default function Navbar({ onMenuClick }) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const toast      = useToast();
  const user       = useSelector(selectCurrentUser);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const [logoutApi] = useLogoutMutation();
  const [dropOpen, setDropOpen]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData, refetch: refetchNotifs } = useGetNotificationsQuery({ limit: 20 }, { pollingInterval: 30000 });
  const [markAllRead]       = useMarkAllReadMutation();
  const [markAsRead]        = useMarkAsReadMutation();
  const [respondInv]        = useRespondToInvitationMutation();
  const [respondAss]        = useRespondToAssignmentMutation();
  const [actionPending, setActionPending] = useState({});
  const notifRef = useRef(null);
  const dropRef  = useRef(null);

  const notifications = notifData?.data ?? notifData ?? [];
  const unread = Array.isArray(notifications) ? notifications.filter((n) => !n.is_read).length : 0;

  // Real-time: refetch instantly when a new notification arrives over the socket
  // (instead of waiting for the 30s poll) and pop up a toast with its content.
  useEffect(() => {
    const socket = getSocket();
    const handleNew = (n) => {
      refetchNotifs();
      toast({
        message: n?.title ? `${n.title} — ${n.message}` : "You have a new notification",
        type: "info",
        duration: 5000,
        onClick: () => {
          if (n?.id) markAsRead(n.id);
          if (n?.action_url) navigate(n.action_url);
          else setNotifOpen(true); // no target — open the notification panel instead
        },
      });
    };
    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [refetchNotifs, toast]);

  // Close dropdowns when clicking outside them
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await logoutApi().unwrap(); } catch {}
    disconnectSocket();
    dispatch(logoutAction());
    window.location.href = "/login";
  };

  const handleNotifClick = async (n) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
    setNotifOpen(false);
  };

  const handleAction = async (e, n, action) => {
    e.stopPropagation();
    const key = `${n.id}-${action}`;
    setActionPending(p => ({ ...p, [key]: true }));
    try {
      if (!n.is_read) markAsRead(n.id);
      if (n.reference_type === "project_invitation") {
        await respondInv({ id: n.reference_id, action }).unwrap();
        toast({ message: action === "accept" ? "Invitation accepted!" : "Invitation declined.", type: "success" });
      } else if (n.reference_type === "task_assignment_request") {
        await respondAss({ id: n.reference_id, action }).unwrap();
        toast({ message: action === "accept" ? "Assignment accepted!" : "Assignment declined.", type: "success" });
      }
      refetchNotifs();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed", type: "error" });
    } finally {
      setActionPending(p => { const next = { ...p }; delete next[key]; return next; });
    }
  };

  const isActionable = (n) =>
    n.reference_type === "project_invitation" || n.reference_type === "task_assignment_request";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {!sidebarOpen && (
          <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <div className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#navLogo)" />
            <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white" fillOpacity=".9" />
            <circle cx="22" cy="16" r="3" fill="white" fillOpacity=".5" />
            <defs>
              <linearGradient id="navLogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="navbar-brand-name">CollabFlow</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <div ref={notifRef} className="navbar-icon-wrap" style={{ position: "relative" }}>
          <button
            className="navbar-icon-btn"
            onClick={() => { setNotifOpen((o) => !o); setDropOpen(false); }}
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7.5 14.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {unread > 0 && <span className="navbar-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown" style={{ width: 360 }}>
              <div className="notif-header">
                <span>Notifications</span>
                <div className="flex items-center gap-2">
                  <Link
                    to="/requests"
                    className="text-xs text-brand-400 hover:text-brand-300"
                    onClick={() => setNotifOpen(false)}
                  >
                    View Requests
                  </Link>
                  {unread > 0 && (
                    <button className="notif-mark-all" onClick={() => markAllRead()}>
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.is_read ? "" : " notif-item-unread"}`}
                      onClick={() => handleNotifClick(n)}
                      style={{ cursor: n.action_url ? "pointer" : "default" }}
                    >
                      <div className="notif-dot" style={{ background: n.is_read ? "transparent" : "#6366f1" }} />
                      <div className="notif-body" style={{ flex: 1 }}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        {isActionable(n) && !n.is_read && (
                          <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleAction(e, n, "accept")}
                              disabled={!!actionPending[`${n.id}-accept`]}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                            >
                              {actionPending[`${n.id}-accept`] ? "…" : (
                                <span className="inline-flex items-center gap-1"><Icon name="check" className="w-3 h-3" />Accept</span>
                              )}
                            </button>
                            <button
                              onClick={(e) => handleAction(e, n, "reject")}
                              disabled={!!actionPending[`${n.id}-reject`]}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              {actionPending[`${n.id}-reject`] ? "…" : (
                                <span className="inline-flex items-center gap-1"><Icon name="x" className="w-3 h-3" />Reject</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div ref={dropRef} className="navbar-icon-wrap" style={{ position: "relative" }}>
          <button
            className="navbar-avatar-btn"
            onClick={() => { setDropOpen((o) => !o); setNotifOpen(false); }}
          >
            {user?.avatar ? (
              <img src={resolveAssetUrl(user.avatar)} alt={user.name} className="navbar-avatar-img" />
            ) : (
              <span className="navbar-avatar-initials" style={{ background: user?.color || "#6366f1" }}>
                {user?.initials || "?"}
              </span>
            )}
          </button>
          {dropOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <div className="user-dropdown-name">{user?.name}</div>
                <div className="user-dropdown-email">{user?.email}</div>
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item" onClick={() => { navigate("/profile"); setDropOpen(false); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Profile
              </button>
              <button className="user-dropdown-item" onClick={() => { navigate("/settings"); setDropOpen(false); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Settings
              </button>
              <button className="user-dropdown-item" onClick={() => { navigate("/requests"); setDropOpen(false); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 1l4 4-6 6H5V7l6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                Requests
              </button>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item user-dropdown-logout" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
