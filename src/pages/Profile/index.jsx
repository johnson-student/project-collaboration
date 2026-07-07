import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Icon, ProjectIcon } from "../../components/common/icons.jsx";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  updateProfile,
} from "../../features/auth/authSlice.js";
import { useGetTasksQuery } from "../../features/tasks/taskApiSlice.js";
import { useGetProjectsQuery } from "../../features/projects/projectApiSlice.js";
import {
  useUpdateAvatarMutation,
  useUpdateUserMutation,
} from "../../features/users/userApiSlice.js";
import {
  Button,
  ProgressBar,
  StatusBadge,
} from "../../components/ui/index.jsx";
import { Input } from "../../components/forms/index.jsx";
import { resolveAssetUrl } from "../../utils/helpers.js";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [updateAvatar, { isLoading: uploading }] = useUpdateAvatarMutation();

  const { data: tasksRes = {} } = useGetTasksQuery();
  const { data: projectsRes = {} } = useGetProjectsQuery();

  const tasks = tasksRes.data ?? (Array.isArray(tasksRes) ? tasksRes : []);
  const projects =
    projectsRes.data ?? (Array.isArray(projectsRes) ? projectsRes : []);

  const myTasks = tasks.filter(
    (t) => (t.assignee_id ?? t.assigneeId) === user?.id,
  );
  const doneTasks = myTasks.filter((t) => t.status === "Done");
  // projects already scoped to user — all are "mine"
  const myProjects = projects;

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    role: user?.role || "",
  });
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? resolveAssetUrl(user.avatar) : "",
  );

  useEffect(() => {
    setForm({ name: user?.name || "", role: user?.role || "" });
    setAvatarPreview(user?.avatar ? resolveAssetUrl(user.avatar) : "");
    console.log("updated avatar preview:", resolveAssetUrl(user?.avatar));
  }, [user?.name, user?.role, user?.avatar]);

  useEffect(() => {
    if (!avatarFile) return;
    const nextPreview = URL.createObjectURL(avatarFile);
    setAvatarPreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [avatarFile]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setAvatarFile(file);
  };

  const handleSave = async () => {
    setError("");
    try {
      if (form.name !== user?.name || form.role !== user?.role) {
        const updated = await updateUser({
          id: user.id,
          name: form.name,
          role: form.role,
        }).unwrap();
        dispatch(updateProfile(updated));
      }

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarUpdated = await updateAvatar({
          id: user.id,
          formData,
        }).unwrap();
        dispatch(updateProfile(avatarUpdated));
      }

      setAvatarFile(null);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.data?.message || "Failed to save.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/6 overflow-hidden"
        style={{
          background: "linear-gradient(145deg,#111827 0%,#0f172a 100%)",
        }}
      >
        <div
          className="h-28 w-full"
          style={{
            background: `linear-gradient(135deg,${user?.color || "#6366f1"}30,#6366f120)`,
          }}
        />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-5">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-950"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold ring-4 ring-slate-950"
                  style={{ backgroundColor: user?.color || "#6366f1" }}
                >
                  {user?.initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div className="flex items-center gap-2">
              {error && <span className="text-xs text-red-400">{error}</span>}
              {saved && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-xl font-semibold inline-flex items-center gap-1"
                >
                  <Icon name="check" className="w-3 h-3" /> Saved
                </motion.span>
              )}
              {editing ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    loading={saving || uploading}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  Choose photo
                </label>
                <div className="text-xs text-slate-500">
                  JPG, PNG, WEBP up to 2 MB
                  {avatarFile ? (
                    <span className="ml-2 text-slate-300">
                      {avatarFile.name}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Role / Title"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display font-bold text-white text-2xl">
                {user?.name}
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">{user?.role}</p>
              <p className="text-slate-600 text-xs mt-1">{user?.email}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tasks Assigned", value: myTasks.length, color: "#6366f1" },
          {
            label: "Tasks Completed",
            value: doneTasks.length,
            color: "#10b981",
          },
          {
            label: "Active Projects",
            value: myProjects.filter((p) => p.status === "In Progress").length,
            color: "#8b5cf6",
          },
          {
            label: "Completion Rate",
            value: myTasks.length
              ? `${Math.round((doneTasks.length / myTasks.length) * 100)}%`
              : "0%",
            color: "#f59e0b",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 border border-white/6 text-center"
            style={{ background: "#111827" }}
          >
            <p
              className="font-display font-bold text-3xl mb-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Projects */}
      <div
        className="rounded-2xl border border-white/6 p-5"
        style={{ background: "#111827" }}
      >
        <h3 className="font-display font-bold text-white mb-4">My Projects</h3>
        {myProjects.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">
            Not part of any projects yet
          </p>
        ) : (
          <div className="space-y-3">
            {myProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${p.color}18`,
                    border: `1px solid ${p.color}25`,
                    color: p.color || "#6366f1",
                  }}
                >
                  <ProjectIcon icon={p.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {p.name}
                    </p>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {p.progress ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={p.progress ?? 0} color={p.color} />
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
