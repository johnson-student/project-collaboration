import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateSubtaskMutation,
} from "../../features/tasks/taskApiSlice.js";
import { useCreateAssignmentRequestMutation } from "../../features/assignments/assignmentApiSlice.js";
import { useGetProjectsQuery } from "../../features/projects/projectApiSlice.js";
import {
  PriorityBadge,
  Avatar,
  Button,
  EmptyState,
  Skeleton,
  TagBadge,
  ProgressBar,
} from "../../components/ui/index.jsx";
import { formatDate, isOverdue, isDueSoon } from "../../utils/helpers.js";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import MemberPicker from "../../components/common/MemberPicker.jsx";
import EditTaskModal from "../../components/common/EditTaskModal.jsx";
import SubtaskList from "../../components/common/SubtaskList.jsx";
import "../../components/common/MemberPicker.css";
import { useToast } from "../../components/common/Toast.jsx";
import { Icon, ProjectIcon } from "../../components/common/icons.jsx";
import SubtaskDraftField from "../../components/common/SubtaskDraftField.jsx";
import TaskComments from "../../components/common/TaskComments.jsx";
import "../../components/common/modal.css";

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"];

export default function Tasks() {
  const currentUser = useSelector(selectCurrentUser);
  const taskQueryArgs = currentUser?.id
    ? { assigneeId: currentUser.id }
    : skipToken;
  const { data: tasksRes = {}, isLoading } = useGetTasksQuery(taskQueryArgs);
  const { data: projRes = {} } = useGetProjectsQuery();
  const toast = useToast();
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createAssignmentRequest] = useCreateAssignmentRequestMutation();
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [assignPickerTask, setAssignPickerTask] = useState(null);

  const tasks = tasksRes.data ?? (Array.isArray(tasksRes) ? tasksRes : []);
  const projects = projRes.data ?? (Array.isArray(projRes) ? projRes : []);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [completeConfirmTask, setCompleteConfirmTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    projectId: "",
    dueDate: "",
    tags: "",
    assignee: null,
  });
  const [formError, setFormError] = useState("");
  const [draftSubtasks, setDraftSubtasks] = useState([]);

  // Deep link: /tasks/:taskId (from notifications) expands that task's row
  const { taskId: routeTaskId } = useParams();
  useEffect(() => {
    if (!routeTaskId || isLoading) return;
    setExpandedIds((prev) => new Set(prev).add(Number(routeTaskId)));
    const t = setTimeout(() => {
      document.getElementById(`task-row-${routeTaskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [routeTaskId, isLoading]);

  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchPriority =
      priorityFilter === "All" || t.priority === priorityFilter;
    const matchSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const getProject = (id) => projects.find((p) => p.id === Number(id));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.projectId) return setFormError("Please select a project.");
    try {
      const newTask = await createTask({
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        projectId: Number(form.projectId),
        assigneeId: form.assignee?.id || undefined,
        dueDate: form.dueDate || undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      }).unwrap();
      // Subtasks need the parent task's id, so drafted ones are created right after it
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
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        projectId: "",
        dueDate: "",
        tags: "",
        assignee: null,
      });
      setDraftSubtasks([]);
      // Expand the new row right away so the subtasks are visible immediately.
      setExpandedIds((prev) => new Set(prev).add(newTask.id));
    } catch (err) {
      setFormError(err?.data?.message || "Failed to create task.");
    }
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setDraftSubtasks([]);
    setFormError("");
  };

  const toggleExpand = (taskId) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });

  const changeStatus = async (task, status) => {
    try {
      await updateTask({ id: task.id, status }).unwrap();
    } catch (err) {
      if (err?.status === 409 && err?.data?.requiresConfirmation) {
        setCompleteConfirmTask(task);
        return;
      }
      toast({ message: err?.data?.message || "Failed to update status", type: "error" });
    }
  };

  const handleToggleDone = (task) =>
    changeStatus(task, task.status === "Done" ? "Todo" : "Done");

  const confirmCompleteAll = async () => {
    if (!completeConfirmTask) return;
    try {
      await updateTask({
        id: completeConfirmTask.id,
        status: "Done",
        completeSubtasks: true,
      }).unwrap();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to complete task", type: "error" });
    } finally {
      setCompleteConfirmTask(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget.id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete task.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRequestAssign = async (task, user) => {
    if (!user) return;
    setAssigningTaskId(task.id);
    try {
      await createAssignmentRequest({ taskId: task.id, assigneeId: user.id }).unwrap();
      toast({ message: `Assignment request sent to ${user.name}`, type: "success" });
      setAssignPickerTask(null);
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to send assignment request", type: "error" });
    } finally {
      setAssigningTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">
          {tasks.length} total ·{" "}
          {tasks.filter((t) => t.status === "In Progress").length} in progress
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-4 h-4"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-xs">
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
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-300 placeholder-slate-600 bg-white/5 border border-white/10 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "Todo", "In Progress", "Review", "Done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/6 border border-transparent"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {["All", "High", "Medium", "Low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priorityFilter === p ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/6 border border-transparent"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title="No tasks found"
          description="Create a task or adjust your filters"
          action={
            <Button onClick={() => setCreateOpen(true)}>Create Task</Button>
          }
        />
      ) : (
        <div
          className="rounded-2xl border border-white/6 overflow-hidden"
          style={{ background: "#111827" }}
        >
          <AnimatePresence>
            {filtered.map((task, i) => {
              const project = getProject(task.project_id ?? task.projectId);
              const overdue =
                isOverdue(task.due_date ?? task.dueDate) &&
                task.status !== "Done";
              const dueSoon =
                isDueSoon(task.due_date ?? task.dueDate) &&
                task.status !== "Done";
              const assignee = task.assignee_name
                ? {
                    id: task.assignee_id,
                    name: task.assignee_name,
                    initials: task.assignee_initials,
                    color: task.assignee_color,
                    avatar: task.assignee_avatar,
                  }
                : null;

              const hasSubtasks = (task.subtask_total || 0) > 0;
              const subtaskPct = hasSubtasks
                ? Math.round((task.subtask_done / task.subtask_total) * 100)
                : 0;
              const isExpanded = expandedIds.has(task.id);

              return (
                <motion.div
                  key={task.id}
                  id={`task-row-${task.id}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 last:border-0"
                >
                <div className="flex items-center gap-4 px-4 py-4 hover:bg-white/3 transition-colors group">
                  {/* Expand / collapse subtasks */}
                  <button
                    onClick={() => toggleExpand(task.id)}
                    title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                    className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-500 hover:text-slate-300 transition-transform"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Completion toggle */}
                  <button
                    onClick={() => handleToggleDone(task)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${task.status === "Done" ? "bg-emerald-500 border-0" : "border-2 border-slate-600 hover:border-brand-500"}`}
                  >
                    {task.status === "Done" && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        className="w-3 h-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${task.status === "Done" ? "line-through text-slate-600" : "text-slate-200"}`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {project && (
                        <span
                          className="text-[11px] font-medium px-1.5 py-0.5 rounded-md inline-flex items-center gap-1"
                          style={{
                            color: project.color,
                            background: `${project.color}15`,
                          }}
                        >
                          <ProjectIcon icon={project.icon} className="w-3 h-3" /> {project.name}
                        </span>
                      )}
                      {task.tags?.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                    {hasSubtasks && (
                      <div className="flex items-center gap-2 mt-1.5 max-w-50">
                        <ProgressBar value={subtaskPct} className="flex-1" />
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {task.subtask_done}/{task.subtask_total} subtasks
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeStatus(task, e.target.value)}
                      title="Update status"
                      className="text-xs font-semibold rounded-full pl-2.5 pr-1.5 py-1 bg-white/5 border border-white/10 text-slate-300 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-slate-900">
                          {s}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`text-xs font-medium inline-flex items-center gap-1 ${overdue ? "text-red-400" : dueSoon ? "text-amber-400" : "text-slate-600"}`}
                    >
                      {overdue ? <Icon name="warning" className="w-3 h-3" /> : dueSoon ? <Icon name="bell" className="w-3 h-3" /> : null}
                      {formatDate(task.due_date ?? task.dueDate)}
                    </span>
                    {assignee && <Avatar user={assignee} size="sm" />}

                    {/* Assign Request */}
                    {task.project_id && (
                      <button
                        type="button"
                        onClick={() => setAssignPickerTask(task)}
                        title="Request task assignment"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-brand-300 hover:bg-brand-400/10 transition-all"
                        disabled={assigningTaskId === task.id}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                        </svg>
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => setEditTask(task)}
                      title="Edit task"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-brand-400 hover:bg-brand-400/10 transition-all"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(task)}
                      title="Delete task"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-3.5 h-3.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-black/15"
                    >
                      <SubtaskList taskId={task.id} />
                      <div className="px-4 pb-4">
                        <TaskComments taskId={task.id} currentUser={currentUser} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Task Modal */}
      {createOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && closeCreateModal()}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">New Task</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && <div className="modal-error">{formError}</div>}
              <div className="mf-field">
                <label className="mf-label">Title *</label>
                <input
                  required
                  className="mf-input"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="mf-field">
                <label className="mf-label">Description</label>
                <textarea
                  className="mf-input mf-textarea"
                  rows={2}
                  placeholder="Optional details…"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="mf-row">
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Status</label>
                  <select
                    className="mf-input mf-select"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value,
                        assignee: null,
                      }))
                    }
                  >
                    {["Todo", "In Progress", "Review", "Done"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Priority</label>
                  <select
                    className="mf-input mf-select"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    {["Low", "Medium", "High", "Critical"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mf-row">
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Project *</label>
                  <select
                    className="mf-input mf-select"
                    value={form.projectId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        projectId: e.target.value,
                        assignee: null,
                      }))
                    }
                  >
                    <option value="">Select project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mf-field mf-field-grow">
                  <label className="mf-label">Due date</label>
                  <input
                    type="date"
                    className="mf-input"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mf-field">
                <label className="mf-label">
                  Assignee{" "}
                  {form.projectId
                    ? "(project members only)"
                    : "(select a project first)"}
                </label>
                <MemberPicker
                  projectId={form.projectId || undefined}
                  scope="project-members"
                  currentUserId={currentUser?.id}
                  single
                  selected={form.assignee ? [form.assignee] : []}
                  onChange={(arr) =>
                    setForm((f) => ({ ...f, assignee: arr[0] ?? null }))
                  }
                  placeholder={
                    form.projectId ? "Select member…" : "Select a project first"
                  }
                />
              </div>
              <div className="mf-field">
                <label className="mf-label">Tags (comma-separated)</label>
                <input
                  className="mf-input"
                  placeholder="frontend, bug, api…"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                />
              </div>
              <SubtaskDraftField drafts={draftSubtasks} onChange={setDraftSubtasks} />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <EditTaskModal
          task={editTask}
          projectId={editTask.project_id ?? editTask.projectId}
          onClose={() => setEditTask(null)}
          onUpdated={() => setEditTask(null)}
        />
      )}

      {/* Complete Task Confirmation (Rule 3: unfinished subtasks) */}
      {completeConfirmTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setCompleteConfirmTask(null)}
        >
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Complete this task?</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCompleteConfirmTask(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">
                This task still has unfinished subtasks. Completing the parent
                task will also mark all remaining subtasks as completed.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setCompleteConfirmTask(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmCompleteAll}
                >
                  Complete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task?</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">
                Are you sure you want to delete{" "}
                <strong className="text-white">{deleteTarget.title}</strong>?
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDelete}
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assignment Request Picker Modal */}
      {assignPickerTask && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setAssignPickerTask(null)}>
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">Request Task Assignment</h2>
              <button type="button" className="modal-close" onClick={() => setAssignPickerTask(null)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-xs text-slate-500 mb-3">
                Select a project member to send an assignment request for <strong className="text-slate-300">"{assignPickerTask.title}"</strong>.
                They must accept before the task is assigned.
              </p>
              <MemberPicker
                projectId={assignPickerTask.project_id}
                scope="project-members"
                currentUserId={currentUser?.id}
                single
                selected={[]}
                onChange={arr => arr[0] && handleRequestAssign(assignPickerTask, arr[0])}
                placeholder="Select member to assign…"
              />
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setAssignPickerTask(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
