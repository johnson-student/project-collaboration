import { useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetTasksQuery, useMoveTaskMutation, useDeleteTaskMutation } from "../../features/tasks/taskApiSlice.js";
import { useGetProjectsQuery } from "../../features/projects/projectApiSlice.js";
import { PriorityBadge, Avatar, TagBadge, Skeleton, ProgressBar } from "../../components/ui/index.jsx";
import { formatDate, isOverdue } from "../../utils/helpers.js";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import EditTaskModal from "../../components/common/EditTaskModal.jsx";
import "../../components/common/modal.css";
import { Icon, ProjectIcon } from "../../components/common/icons.jsx";

const COLUMNS = [
  { id:"Todo",        label:"To Do",       color:"#64748b", dotColor:"bg-slate-500" },
  { id:"In Progress", label:"In Progress",  color:"#6366f1", dotColor:"bg-brand-500" },
  { id:"Review",      label:"In Review",    color:"#f59e0b", dotColor:"bg-amber-400" },
  { id:"Done",        label:"Done",         color:"#10b981", dotColor:"bg-emerald-500" },
];

export default function Kanban() {
  const currentUser = useSelector(selectCurrentUser);
  const taskQueryArgs = currentUser?.id
    ? { assigneeId: currentUser.id }
    : skipToken;
  const { data: tasksRes = {}, isLoading } = useGetTasksQuery(taskQueryArgs);
  const { data: projRes  = {} }            = useGetProjectsQuery();
  const [moveTask]   = useMoveTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const tasks    = tasksRes.data ?? (Array.isArray(tasksRes) ? tasksRes : []);
  const projects = projRes.data  ?? (Array.isArray(projRes)  ? projRes  : []);

  const [draggedTask,      setDraggedTask]      = useState(null);
  const [dragOverColumn,   setDragOverColumn]   = useState(null);
  const [projectFilter,    setProjectFilter]    = useState("all");
  const [editTask,         setEditTask]         = useState(null);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [completeConfirm,  setCompleteConfirm]  = useState(null); // { task, colId }

  const filteredTasks = projectFilter === "all"
    ? tasks
    : tasks.filter((t) => String(t.project_id ?? t.projectId) === projectFilter);

  const getTasksByColumn = (colId) => filteredTasks.filter((t) => t.status === colId);
  const getProject = (id) => projects.find((p) => p.id === Number(id));

  const handleDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver  = (e, colId) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverColumn(colId); };
  const handleDrop      = async (e, colId) => {
    e.preventDefault();
    const task = draggedTask;
    setDraggedTask(null); setDragOverColumn(null);
    if (!task || task.status === colId) return;
    try {
      await moveTask({ id: task.id, status: colId }).unwrap();
    } catch (err) {
      if (err?.status === 409 && err?.data?.requiresConfirmation) {
        setCompleteConfirm({ task, colId });
      }
    }
  };
  const handleDragEnd = () => { setDraggedTask(null); setDragOverColumn(null); };

  const confirmCompleteAll = async () => {
    if (!completeConfirm) return;
    try {
      await moveTask({
        id: completeConfirm.task.id,
        status: completeConfirm.colId,
        completeSubtasks: true,
      }).unwrap();
    } finally {
      setCompleteConfirm(null);
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

  return (
    <div className="space-y-5">
      {/* Project filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">Project:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setProjectFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${projectFilter==="all" ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/6 border border-transparent"}`}>
            All Projects
          </button>
          {projects.map((p) => (
            <button key={p.id} onClick={() => setProjectFilter(String(p.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${projectFilter===String(p.id) ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/6 border border-transparent"}`}>
              <ProjectIcon icon={p.icon} className="w-3.5 h-3.5" />{p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks   = getTasksByColumn(col.id);
          const isDragOver = dragOverColumn === col.id;
          return (
            <div key={col.id} onDragOver={(e) => handleDragOver(e, col.id)} onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border transition-all duration-200 ${isDragOver ? "border-brand-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "border-white/6"}`}
              style={{ background: isDragOver ? "rgba(99,102,241,0.04)" : "#111827" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dotColor}`}/>
                  <span className="text-sm font-display font-semibold text-slate-300">{col.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color:col.color, background:`${col.color}18` }}>
                  {colTasks.length}
                </span>
              </div>

              <div className="p-2 space-y-2 min-h-[200px]">
                {isLoading
                  ? [0,1,2].map((i) => <Skeleton key={i} className="h-24 rounded-xl"/>)
                  : colTasks.map((task) => {
                      const project   = getProject(task.project_id ?? task.projectId);
                      const overdue   = isOverdue(task.due_date ?? task.dueDate) && task.status !== "Done";
                      const isDragging = draggedTask?.id === task.id;
                      const assignee  = task.assignee_name ? {
                        id: task.assignee_id, name: task.assignee_name,
                        initials: task.assignee_initials, color: task.assignee_color, avatar: task.assignee_avatar,
                      } : null;
                      const hasSubtasks = (task.subtask_total || 0) > 0;
                      const subtaskPct = hasSubtasks
                        ? Math.round((task.subtask_done / task.subtask_total) * 100)
                        : 0;

                      return (
                        <motion.div key={task.id} layout draggable
                          onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}
                          onClick={() => setEditTask(task)}
                          whileHover={{ scale:1.01 }}
                          className={`rounded-xl p-3 border cursor-grab active:cursor-grabbing transition-all group relative ${isDragging ? "opacity-40 border-brand-500/30" : "border-white/6 hover:border-white/14 bg-white/3 hover:bg-white/5"}`}>
                          {project && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <ProjectIcon icon={project.icon} className="w-3 h-3" style={{ color: project.color }} />
                              <span className="text-[10px] font-semibold" style={{ color:project.color }}>{project.name}</span>
                            </div>
                          )}
                          <p className="text-sm font-medium text-slate-200 leading-snug mb-2 pr-14">{task.title}</p>
                          {task.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {task.tags.slice(0,2).map((tag) => <TagBadge key={tag} tag={tag}/>)}
                            </div>
                          )}
                          {hasSubtasks && (
                            <div className="mb-2">
                              <div className="flex items-center gap-2">
                                <ProgressBar value={subtaskPct} className="flex-1"/>
                                <span className="text-[10px] font-semibold text-slate-500 shrink-0">{subtaskPct}%</span>
                              </div>
                              <span className="text-[10px] text-slate-600">
                                {task.subtask_done}/{task.subtask_total} subtasks completed
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <PriorityBadge priority={task.priority}/>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium inline-flex items-center gap-1 ${overdue ? "text-red-400" : "text-slate-600"}`}>
                                {overdue && <Icon name="warning" className="w-3 h-3" />}
                                {formatDate(task.due_date ?? task.dueDate)}
                              </span>
                              {assignee && <Avatar user={assignee} size="sm"/>}
                            </div>
                          </div>

                          {/* Edit / Delete buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 transition-all">
                            <button type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); setEditTask(task); }}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-brand-400 hover:bg-brand-400/10 transition-all">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                }
                {isDragOver && !isLoading && (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="rounded-xl border-2 border-dashed border-brand-500/40 h-16 flex items-center justify-center">
                    <span className="text-xs text-brand-400 font-medium">Drop here</span>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      {editTask && (
        <EditTaskModal
          task={editTask}
          projectId={editTask.project_id ?? editTask.projectId}
          onClose={() => setEditTask(null)}
          onUpdated={() => setEditTask(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task?</h2>
              <button type="button" className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">
                Are you sure you want to delete <strong className="text-white">{deleteTarget.title}</strong>?
                This cannot be undone.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn-danger" onClick={handleDelete}>Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Confirmation (Rule 3: unfinished subtasks) */}
      {completeConfirm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setCompleteConfirm(null)}>
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
    </div>
  );
}
