import { useState } from "react";
import { motion } from "framer-motion";
import { useGetUsersQuery } from "../../features/users/userApiSlice.js";
import { Skeleton, EmptyState } from "../../components/ui/index.jsx";
import { formatDate } from "../../utils/helpers.js";
import { resolveAssetUrl } from "../../utils/helpers.js";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice.js";

const statusDot = {
  Active: "bg-emerald-400",
  Away: "bg-amber-400",
  Busy: "bg-red-400",
  Offline: "bg-slate-600",
};

export default function TeamMembers() {
  const { data: res = {}, isLoading } = useGetUsersQuery();
  const currentUser = useSelector(selectCurrentUser);
  const users = res.data ?? (Array.isArray(res) ? res : []);
  const members = users.filter((u) => u.id !== currentUser?.id);
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">
          {members.length} co-members across your projects
        </p>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team..."
            className="pl-9 pr-4 py-2 w-56 rounded-xl text-sm text-slate-300 placeholder-slate-600 bg-white/5 border border-white/10 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No members found"
          description="You'll see teammates once you're added to a shared project"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl p-5 border border-white/6 hover:border-white/12 transition-all"
              style={{
                background: "linear-gradient(145deg,#111827 0%,#0f172a 100%)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={resolveAssetUrl(user.avatar)}
                      alt={user.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: user.color || "#6366f1" }}
                    >
                      {user.initials}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-950 ${statusDot[user.status] || "bg-slate-600"}`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 capitalize bg-white/5 px-2 py-0.5 rounded-lg">
                  {user.status}
                </span>
              </div>
              <h3 className="font-display font-bold text-white text-base mb-0.5">
                {user.name}
              </h3>
              <p className="text-sm text-slate-500 mb-1">{user.role}</p>
              <p className="text-xs text-slate-600 mb-4 truncate">
                {user.email}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/4 rounded-xl p-2 text-center">
                  <p className="font-display font-bold text-white text-lg">
                    {user.tasksCompleted ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-600">Tasks Done</p>
                </div>
                <div className="bg-white/4 rounded-xl p-2 text-center">
                  <p className="font-display font-bold text-white text-lg">
                    {user.projectsActive ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-600">Projects</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3.5 h-3.5"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined {formatDate(user.joined_at ?? user.joinedAt)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
