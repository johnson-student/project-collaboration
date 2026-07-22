import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/common/Toast.jsx";
import { getSocket } from "../../api/socket.js";
import {
  useGetProjectByIdQuery, useGetProjectMembersQuery,
  useRemoveProjectMemberMutation, useDeleteProjectMutation,
} from "../../features/projects/projectApiSlice.js";
import {
  useGetProjectInvitationsQuery, useCreateInvitationMutation, useCancelInvitationMutation,
} from "../../features/invitations/invitationApiSlice.js";
import { useGetProjectFilesQuery, useUploadProjectFileMutation, useDeleteProjectFileMutation } from "../../features/files/fileApiSlice.js";
import { useGetProjectActivityQuery } from "../../features/activity/activityApiSlice.js";
import {
  useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation,
  useDeleteTaskMutation, useMoveTaskMutation, useCreateSubtaskMutation,
  useGetTaskByIdQuery,
} from "../../features/tasks/taskApiSlice.js";
import { StatusBadge, PriorityBadge, ProgressBar, Avatar, TagBadge, Skeleton } from "../../components/ui/index.jsx";
import { formatDate, formatDateTime, resolveAssetUrl, cn } from "../../utils/helpers.js";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import MemberPicker from "../../components/common/MemberPicker.jsx";
import EditProjectModal from "../../components/common/EditProjectModal.jsx";
import EditTaskModal from "../../components/common/EditTaskModal.jsx";
import SubtaskList from "../../components/common/SubtaskList.jsx";
import SubtaskDraftField from "../../components/common/SubtaskDraftField.jsx";
import TaskComments from "../../components/common/TaskComments.jsx";
import ChatPanel from "../../components/common/ChatPanel.jsx";
import AiChatPanel from "../../components/common/AiChatPanel.jsx";
import "../../components/common/MemberPicker.css";
import "../../components/common/modal.css";
import { apiBaseUrl, getStoredAccessToken } from "../../api/authSession.js";
import { Icon, ProjectIcon } from "../../components/common/icons.jsx";

const COLUMNS = ["Todo", "In Progress", "Review", "Done"];

// ── Activity icon map ─────────────────────────────────────
const activityIcons = {
  project_created:  { icon: "rocket",       color: "#6366f1" },
  member_invited:   { icon: "mail",         color: "#8b5cf6" },
  member_joined:    { icon: "sparkles",     color: "#10b981" },
  member_removed:   { icon: "hand",         color: "#ef4444" },
  task_created:     { icon: "check-circle", color: "#06b6d4" },
  task_assigned:    { icon: "clipboard",    color: "#f59e0b" },
  task_completed:   { icon: "trophy",       color: "#10b981" },
  task_deleted:     { icon: "trash",        color: "#ef4444" },
  file_uploaded:    { icon: "paperclip",    color: "#6366f1" },
  file_deleted:     { icon: "trash",        color: "#ef4444" },
  comment_added:    { icon: "message",      color: "#8b5cf6" },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


// ── Task Detail Slide-over ────────────────────────────────
function TaskDetailModal({ taskId, onClose, currentUser }) {
  const { data: task, isLoading } = useGetTaskByIdQuery(taskId, { skip: !taskId });
  if (!taskId) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isLoading ? "Loading…" : task?.title}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        {isLoading ? <div className="p-4"><Skeleton className="h-20 w-full" /></div> : task && (
          <div className="modal-form">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && <span className="text-xs text-slate-500">Due {formatDate(task.due_date)}</span>}
            </div>
            {task.description && <p className="text-sm text-slate-400 mb-4">{task.description}</p>}
            <div className="mb-4">
              <SubtaskList taskId={task.id} />
            </div>
            <TaskComments taskId={task.id} currentUser={currentUser} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Files Section ─────────────────────────────────────────
function FilesSection({ projectId, canManage, currentUserId, projectRole }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const { data: files = [], isLoading } = useGetProjectFilesQuery(projectId);
  const [uploadFile,  { isLoading: uploading }] = useUploadProjectFileMutation();
  const [deleteFile]                            = useDeleteProjectFileMutation();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile({ projectId, file }).unwrap();
      toast({ message: `"${file.name}" uploaded successfully`, type: "success" });
    } catch (err) {
      toast({ message: err?.data?.message || "Upload failed", type: "error" });
    }
    e.target.value = "";
  };

  const handleDelete = async (f) => {
    if (!window.confirm(`Delete "${f.original_name}"?`)) return;
    try {
      await deleteFile({ projectId, fileId: f.id }).unwrap();
      toast({ message: "File deleted", type: "success" });
    } catch (err) {
      toast({ message: err?.data?.message || "Delete failed", type: "error" });
    }
  };

  const handleDownload = (f) => {
    const token = getStoredAccessToken();
    const url = `${apiBaseUrl}/projects/${projectId}/files/${f.id}/download`;
    const a = document.createElement("a");
    a.href = url;
    a.download = f.original_name;
    // Use fetch with auth header for download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const burl = URL.createObjectURL(blob);
        a.href = burl;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(burl);
        document.body.removeChild(a);
      })
      .catch(() => toast({ message: "Download failed", type: "error" }));
  };

  const fileIcon = (mime) => {
    if (mime?.includes("image")) return "image";
    if (mime?.includes("pdf")) return "file-text";
    if (mime?.includes("spreadsheet") || mime?.includes("excel")) return "chart";
    if (mime?.includes("word") || mime?.includes("document")) return "file-text";
    if (mime?.includes("zip") || mime?.includes("tar") || mime?.includes("rar")) return "archive";
    if (mime?.includes("video")) return "film";
    if (mime?.includes("audio")) return "music";
    return "paperclip";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-white">Files ({files.length})</h3>
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl p-8 border border-white/6 text-center" style={{ background: "#111827" }}>
          <p className="text-slate-700 text-sm">No files uploaded yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: "#111827" }}>
          {files.map((f, idx) => {
            const canDelete = f.uploader_id === currentUserId || ["Owner", "Admin"].includes(projectRole);
            return (
              <div key={f.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-all group ${idx !== 0 ? "border-t border-white/4" : ""}`}>
                <span className="shrink-0 text-slate-400"><Icon name={fileIcon(f.mime_type)} className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{f.original_name}</p>
                  <p className="text-xs text-slate-600">{formatFileSize(f.size_bytes)} · Uploaded by {f.uploader_name} · {formatDate(f.created_at)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleDownload(f)}
                    title="Download"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-400 hover:bg-brand-400/10 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(f)}
                      title="Delete"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Activity Timeline ─────────────────────────────────────
function ActivityTimeline({ projectId }) {
  const { data: activities = [], isLoading, refetch } = useGetProjectActivityQuery({ projectId, limit: 50 });

  // Real-time: join the project room and refetch the moment a new activity lands,
  // so the timeline updates live without a manual refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const doJoin = () => socket.emit("project:join", projectId);
    if (socket.connected) doJoin();
    socket.on("connect", doJoin);

    const handleNewActivity = (activity) => {
      if (Number(activity.project_id) === Number(projectId)) refetch();
    };
    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("connect", doJoin);
      socket.off("activity:new", handleNewActivity);
    };
  }, [projectId, refetch]);

  if (isLoading) return <div className="space-y-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (activities.length === 0) return (
    <div className="rounded-2xl p-8 border border-white/6 text-center" style={{ background: "#111827" }}>
      <p className="text-slate-700 text-sm">No activity yet.</p>
    </div>
  );
  return (
    <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: "#111827" }}>
      <div className="divide-y divide-white/4">
        {activities.map((a) => {
          const cfg = activityIcons[a.event_type] || { icon: "pin", color: "#6366f1" };
          return (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}25`, color: cfg.color }}
              >
                <Icon name={cfg.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{a.description}</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(a.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Invitations Panel ─────────────────────────────────────
function InvitationsPanel({ projectId, currentUserId }) {
  const toast = useToast();
  const { data: invitations = [] } = useGetProjectInvitationsQuery(projectId);
  const [cancelInv] = useCancelInvitationMutation();

  const pending = invitations.filter(i => i.status === "Pending");
  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl p-3 bg-yellow-500/5 border border-yellow-500/15 mb-4">
      <p className="text-xs font-semibold text-yellow-400 mb-2">⏳ Pending Invitations ({pending.length})</p>
      <div className="space-y-1.5">
        {pending.map(inv => (
          <div key={inv.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: inv.color || "#6366f1" }}>
                {inv.initials}
              </div>
              <span className="text-xs text-slate-300">{inv.invitee_name}</span>
              <span className="text-xs text-slate-600">· {inv.role}</span>
            </div>
            <button
              onClick={async () => {
                try { await cancelInv({ projectId, invitationId: inv.id }).unwrap(); }
                catch { toast({ message: "Failed to cancel", type: "error" }); }
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-all"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ProjectDetails ───────────────────────────────────
export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const toast = useToast();

  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: members = [], refetch: refetchMembers } = useGetProjectMembersQuery(id);
  const { data: tasksRes = {}, isLoading: tasksLoading } = useGetTasksQuery({ projectId: id });
  const [removeMember] = useRemoveProjectMemberMutation();
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateTask]  = useUpdateTaskMutation();
  const [deleteTask]  = useDeleteTaskMutation();
  const [moveTask]    = useMoveTaskMutation();
  const [deleteProject, { isLoading: deletingProject }] = useDeleteProjectMutation();
  const [createInvitation, { isLoading: inviting }] = useCreateInvitationMutation();

  const allTasks = tasksRes.data ?? (Array.isArray(tasksRes) ? tasksRes : []);

  const [activeTab, setActiveTab] = useState("tasks");
  const [addOpen, setAddOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newMembers, setNewMembers] = useState([]);
  const [addError, setAddError] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium", status: "Todo", dueDate: "", tags: "", assignee: null });
  const [taskError, setTaskError] = useState("");
  const [draftSubtasks, setDraftSubtasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [completeConfirm, setCompleteConfirm] = useState(null); // { task, status }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
  if (!project) return <div className="text-slate-500 p-8">Project not found or access denied.</div>;

  const myRole = project.myRole ?? members.find(m => m.id === currentUser?.id)?.member_role ?? "Member";
  const canManage = ["Owner", "Admin"].includes(myRole);

  const getTasksByStatus = (status) => allTasks.filter(t => t.status === status);

  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, status) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverColumn(status); };
  const handleDragEnd = () => { setDraggedTask(null); setDragOverColumn(null); };
  const handleDrop = async (e, status) => {
    e.preventDefault();
    const task = draggedTask;
    setDraggedTask(null);
    setDragOverColumn(null);
    if (!task || task.status === status) return;
    try {
      await moveTask({ id: task.id, status }).unwrap();
    } catch (err) {
      if (err?.status === 409 && err?.data?.requiresConfirmation) {
        setCompleteConfirm({ task, status });
      } else {
        toast({ message: err?.data?.message || "Failed to move task.", type: "error" });
      }
    }
  };
  const confirmCompleteAll = async () => {
    if (!completeConfirm) return;
    try {
      await moveTask({ id: completeConfirm.task.id, status: completeConfirm.status, completeSubtasks: true }).unwrap();
    } finally {
      setCompleteConfirm(null);
    }
  };

  const handleInviteMembers = async () => {
    if (!newMembers.length) return;
    setAddError("");
    try {
      for (const u of newMembers) {
        await createInvitation({ projectId: id, userId: u.id, role: "Member" }).unwrap();
      }
      toast({ message: newMembers.length === 1 ? "Invitation sent!" : `${newMembers.length} invitations sent!`, type: "success" });
      setNewMembers([]);
      setAddOpen(false);
    } catch (err) {
      setAddError(err?.data?.message || "Failed to send invitation.");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the project?")) return;
    await removeMember({ projectId: id, userId });
    refetchMembers();
  };

  const closeTaskModal = () => {
    setTaskOpen(false);
    setDraftSubtasks([]);
    setTaskError("");
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError("");
    if (!taskForm.title.trim()) return setTaskError("Title is required.");
    try {
      const newTask = await createTask({
        title: taskForm.title, description: taskForm.description || undefined,
        priority: taskForm.priority, status: taskForm.status,
        dueDate: taskForm.dueDate || undefined, projectId: Number(id),
        assigneeId: taskForm.assignee?.id || undefined,
        tags: taskForm.tags ? taskForm.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      }).unwrap();
      // Subtasks need the parent task's id, so they're created right after it
      if (newTask?.id && draftSubtasks.length > 0) {
        for (const s of draftSubtasks) {
          try {
            await createSubtask({
              taskId: newTask.id,
              title: s.title,
              description: s.description || null,
              priority: s.priority,
              dueDate: s.dueDate || null,
            }).unwrap();
          } catch {
            toast({ message: `Couldn't add subtask "${s.title}"`, type: "error" });
          }
        }
      }
      setTaskForm({ title: "", description: "", priority: "Medium", status: "Todo", dueDate: "", tags: "", assignee: null });
      setDraftSubtasks([]);
      setTaskOpen(false);
      // Open the task's detail modal right away so the new subtasks are visible
      // and more can be added.
      if (newTask?.id) setSelectedTaskId(newTask.id);
    } catch (err) {
      setTaskError(err?.data?.message || "Failed to create task.");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    try { await deleteTask(deleteTaskTarget.id).unwrap(); }
    catch (err) { alert(err?.data?.message || "Failed to delete task."); }
    finally { setDeleteTaskTarget(null); }
  };

  const handleDeleteProject = async () => {
    try { await deleteProject(id).unwrap(); navigate("/projects"); }
    catch (err) { alert(err?.data?.message || "Failed to delete project."); }
  };

  const TABS = [
    { key: "tasks",    label: "Tasks" },
    { key: "chat",     label: "Chat" },
    { key: "ai",       label: "✨ AI Assistant" },
    { key: "files",    label: "Files" },
    { key: "activity", label: "Activity" },
    { key: "members",  label: "Team" },
  ];

  return (
    <div className="space-y-8">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Projects
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 border border-white/6" style={{ background: "linear-gradient(135deg,#111827 0%,#0f172a 100%)" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${project.color}18`, border: `1px solid ${project.color}25`, color: project.color || "#6366f1" }}>
              <ProjectIcon icon={project.icon} className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-2xl">{project.name}</h1>
              <p className="text-slate-500 text-sm mt-1">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-lg bg-white/6 text-slate-400 font-medium">{myRole}</span>
            <PriorityBadge priority={project.priority} />
            <StatusBadge status={project.status} />
            {canManage && (
              <>
                <button type="button" onClick={() => setEditProjectOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/25 hover:bg-brand-500/25 transition-all flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                {myRole === "Owner" && (
                  <button type="button" onClick={() => setDeleteProjectConfirm(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Tasks",  value: project.task_count ?? 0 },
            { label: "Completed",    value: project.completed_task_count ?? 0 },
            { label: "Team Size",    value: members.length },
            { label: "Deadline",     value: formatDate(project.deadline) },
          ].map(stat => (
            <div key={stat.label} className="bg-white/4 rounded-xl p-3 text-center">
              <p className="font-display font-bold text-white text-lg">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Overall Progress</span>
          <span className="text-sm font-semibold" style={{ color: project.color }}>{project.progress ?? 0}%</span>
        </div>
        <ProgressBar value={project.progress ?? 0} color={project.color} className="h-2.5" />
      </motion.div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-white/6 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? "text-brand-300 border-b-2 border-brand-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white">Task Overview</h3>
              <button onClick={() => setTaskOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all">
                + Add Task
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {COLUMNS.map(status => {
                const columnTasks = getTasksByStatus(status);
                const isDragOver = dragOverColumn === status;
                return (
                  <div key={status}
                    onDragOver={e => handleDragOver(e, status)}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={e => handleDrop(e, status)}
                    className={`rounded-2xl border overflow-hidden transition-all duration-200 ${isDragOver ? "border-brand-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "border-white/6"}`}
                    style={{ background: isDragOver ? "rgba(99,102,241,0.04)" : "#111827" }}>
                    <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-300">{status}</span>
                      <span className="text-xs font-bold text-slate-500 bg-white/6 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    </div>
                    <div className="p-2 space-y-2 min-h-[80px]">
                      {tasksLoading ? [0,1].map(i => <Skeleton key={i} className="h-16 rounded-xl" />) :
                       columnTasks.length === 0 && !isDragOver ? <p className="text-center text-slate-700 text-xs py-4">No tasks</p> :
                       columnTasks.map(task => {
                         const assignee = members.find(m => m.id === (task.assignee_id ?? task.assigneeId));
                         const isDragging = draggedTask?.id === task.id;
                         return (
                           <div key={task.id}
                             draggable
                             onDragStart={e => handleDragStart(e, task)}
                             onDragEnd={handleDragEnd}
                             className={`rounded-xl p-3 bg-white/3 border hover:border-white/10 transition-all group relative cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40 border-brand-500/30" : "border-white/5"}`}
                             onClick={() => setSelectedTaskId(task.id)}
                           >
                             <p className="text-sm text-slate-300 font-medium leading-snug mb-2 pr-12">{task.title}</p>
                             {(task.subtask_total || 0) > 0 && (
                               <div className="flex items-center gap-2 mb-2">
                                 <ProgressBar value={Math.round((task.subtask_done / task.subtask_total) * 100)} className="flex-1" />
                                 <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                                   {task.subtask_done}/{task.subtask_total}
                                 </span>
                               </div>
                             )}
                             <div className="flex items-center justify-between">
                               <PriorityBadge priority={task.priority} />
                               {assignee && <Avatar user={assignee} size="sm" />}
                             </div>
                             {task.tags?.length > 0 && (
                               <div className="flex flex-wrap gap-1 mt-2">
                                 {task.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                               </div>
                             )}
                             <div className="absolute top-2 right-2 flex gap-1 transition-all">
                               <button type="button"
                                 onMouseDown={e => e.stopPropagation()}
                                 onClick={e => { e.stopPropagation(); setEditTask(task); }}
                                 className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-brand-400 hover:bg-brand-400/10 transition-all">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                   <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                 </svg>
                               </button>
                               <button type="button"
                                 onMouseDown={e => e.stopPropagation()}
                                 onClick={e => { e.stopPropagation(); setDeleteTaskTarget(task); }}
                                 className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                   <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                 </svg>
                               </button>
                             </div>
                           </div>
                         );
                       })
                      }
                      {isDragOver && !tasksLoading && (
                        <div className="rounded-xl border-2 border-dashed border-brand-500/40 h-16 flex items-center justify-center">
                          <span className="text-xs text-brand-400 font-medium">Drop here</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <ChatPanel projectId={id} currentUser={currentUser} projectRole={myRole} />
        )}

        {/* AI Assistant Tab */}
        {activeTab === "ai" && (
          <AiChatPanel projectId={id} />
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <FilesSection projectId={id} canManage={canManage} currentUserId={currentUser?.id} projectRole={myRole} />
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div>
            <h3 className="font-display font-bold text-white mb-4">Activity Timeline</h3>
            <ActivityTimeline projectId={id} />
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "members" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white">Team Members ({members.length})</h3>
              {canManage && (
                <button onClick={() => { setAddError(""); setAddOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all">
                  + Invite Member
                </button>
              )}
            </div>

            {/* Pending invitations summary */}
            {canManage && <InvitationsPanel projectId={id} currentUserId={currentUser?.id} />}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {members.map(member => (
                <motion.div key={member.id} whileHover={{ y: -2 }}
                  className="rounded-2xl p-4 border border-white/6 flex items-center gap-3 group relative"
                  style={{ background: "#111827" }}>
                  <Avatar user={member} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-200 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.member_role ?? member.role}</p>
                  </div>
                  {canManage && member.member_role !== "Owner" && member.id !== currentUser?.id && (
                    <button onClick={() => handleRemoveMember(member.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal (now sends invitation) */}
      {addOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && (setAddOpen(false), setNewMembers([]), setAddError(""))}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Invite Members</h2>
              <button type="button" className="modal-close" onClick={() => { setAddOpen(false); setNewMembers([]); setAddError(""); }}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-xs text-slate-500 mb-3">Selected users will receive an invitation and must accept before joining the project.</p>
              {addError && <div className="modal-error">{addError}</div>}
              <MemberPicker
                projectId={id} scope="exclude-project-members" currentUserId={currentUser?.id}
                selected={newMembers} onChange={setNewMembers} placeholder="Search users to invite…"
              />
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => { setAddOpen(false); setNewMembers([]); setAddError(""); }}>Cancel</button>
                <button type="button" className="btn-primary" disabled={!newMembers.length || inviting} onClick={handleInviteMembers}>
                  {inviting ? "Sending…" : `Send ${newMembers.length || ""} Invitation${newMembers.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {taskOpen && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeTaskModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Add Task to {project.name}</h2>
              <button type="button" className="modal-close" onClick={closeTaskModal}>×</button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-form">
              {taskError && <div className="modal-error">{taskError}</div>}
              <div className="mf-field">
                <label className="mf-label">Task title *</label>
                <input required className="mf-input" placeholder="What needs to be done?" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="mf-field">
                <label className="mf-label">Description</label>
                <textarea className="mf-input mf-textarea" rows="3" placeholder="Add more detail (optional)" value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="mf-row">
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Status</label>
                  <select className="mf-input mf-select" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    {["Todo","In Progress","Review","Done"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Priority</label>
                  <select className="mf-input mf-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    {["Low","Medium","High"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="mf-field">
                <label className="mf-label">Due date</label>
                <input type="date" className="mf-input" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="mf-field">
                <label className="mf-label">Tags (comma-separated)</label>
                <input className="mf-input" placeholder="frontend, bug, api…" value={taskForm.tags}
                  onChange={e => setTaskForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              <SubtaskDraftField drafts={draftSubtasks} onChange={setDraftSubtasks} />
              <div className="mf-field">
                <label className="mf-label">Assignee (must be a project member)</label>
                <MemberPicker projectId={id} scope="project-members" currentUserId={currentUser?.id} single
                  selected={taskForm.assignee ? [taskForm.assignee] : []}
                  onChange={arr => setTaskForm(f => ({ ...f, assignee: arr[0] ?? null }))} placeholder="Select member…" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeTaskModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Creating…" : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal (with comments) */}
      {selectedTaskId && (
        <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} currentUser={currentUser} />
      )}

      {/* Edit Project Modal */}
      {editProjectOpen && <EditProjectModal project={project} onClose={() => setEditProjectOpen(false)} onUpdated={() => setEditProjectOpen(false)} />}

      {/* Edit Task Modal */}
      {editTask && <EditTaskModal task={editTask} projectId={id} onClose={() => setEditTask(null)} onUpdated={() => setEditTask(null)} />}

      {/* Delete Task Confirmation */}
      {deleteTaskTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTaskTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task?</h2>
              <button type="button" className="modal-close" onClick={() => setDeleteTaskTarget(null)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">Are you sure you want to delete <strong className="text-white">{deleteTaskTarget.title}</strong>? This cannot be undone.</p>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setDeleteTaskTarget(null)}>Cancel</button>
                <button type="button" className="btn-danger" onClick={handleDeleteTask}>Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Confirmation (unfinished subtasks) */}
      {completeConfirm && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setCompleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Complete this task?</h2>
              <button type="button" className="modal-close" onClick={() => setCompleteConfirm(null)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">
                This task still has unfinished subtasks. Completing the parent task will also mark all remaining subtasks as completed.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setCompleteConfirm(null)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={confirmCompleteAll}>Complete All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation */}
      {deleteProjectConfirm && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteProjectConfirm(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Project?</h2>
              <button type="button" className="modal-close" onClick={() => setDeleteProjectConfirm(false)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">Are you sure you want to permanently delete <strong className="text-white">{project.name}</strong>? All tasks will also be deleted. This cannot be undone.</p>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setDeleteProjectConfirm(false)}>Cancel</button>
                <button type="button" className="btn-danger" disabled={deletingProject} onClick={handleDeleteProject}>
                  {deletingProject ? "Deleting…" : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
