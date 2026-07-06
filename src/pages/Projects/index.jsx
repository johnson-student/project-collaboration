import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
} from "../../features/projects/projectApiSlice.js";
import { StatusBadge, PriorityBadge, ProgressBar, AvatarGroup, Button, EmptyState, CardSkeleton } from "../../components/ui/index.jsx";
import { formatDate } from "../../utils/helpers.js";
import CreateProjectModal from "../../components/common/CreateProjectModal.jsx";
import EditProjectModal   from "../../components/common/EditProjectModal.jsx";

const STATUS_FILTERS = ["All","Planning","In Progress","Review","Completed","On Hold"];

export default function Projects() {
  const { data: res = {}, isLoading } = useGetProjectsQuery();
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();
  const projects = res.data ?? (Array.isArray(res) ? res : []);

  const [filter, setFilter]           = useState("All");
  const [search, setSearch]           = useState("");
  const [createOpen, setCreateOpen]   = useState(false);
  const [editProject, setEditProject] = useState(null);      // project object to edit
  const [deleteTarget, setDeleteTarget] = useState(null);    // project to confirm-delete

  const filtered = projects.filter((p) => {
    const matchStatus = filter === "All" || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Failed to delete project.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">
          {projects.length} total · {projects.filter((p) => p.status === "In Progress").length} active
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-300 placeholder-slate-600 bg-white/5 border border-white/10 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter===s ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/6 border border-transparent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0,1,2,3,4,5].map((i) => <CardSkeleton key={i}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📁" title="No projects found"
          description={search ? "Try adjusting your search or filters" : "Create your first project to get started"}
          action={<Button onClick={() => setCreateOpen(true)}>Create Project</Button>}/>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((project, i) => (
              <motion.div key={project.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.95 }} transition={{ delay:i*0.04 }}>
                <Link to={`/projects/${project.id}`}>
                  <motion.div whileHover={{ y:-3 }}
                    className="rounded-2xl p-5 border border-white/6 hover:border-white/12 transition-all cursor-pointer h-full group"
                    style={{ background:"linear-gradient(145deg,#111827 0%,#0f172a 100%)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background:`${project.color}18`, border:`1px solid ${project.color}25` }}>
                        {project.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={project.priority}/>
                        {/* Edit button */}
                        <button
                          onClick={(e) => { e.preventDefault(); setEditProject(project); }}
                          title="Edit project"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-brand-400 hover:bg-brand-400/10 transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(project); }}
                          title="Delete project"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-white text-base mb-1">{project.name}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{project.description}</p>

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-600">
                        {project.completed_task_count ?? project.completedTaskCount ?? 0}/{project.task_count ?? project.taskCount ?? 0} tasks
                      </span>
                      <span className="text-xs font-semibold" style={{ color:project.color }}>{project.progress ?? 0}%</span>
                    </div>
                    <ProgressBar value={project.progress ?? 0} color={project.color} className="mb-4"/>

                    <div className="flex items-center justify-between">
                      <AvatarGroup users={project.members ?? []}/>
                      <StatusBadge status={project.status}/>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-2">Due {formatDate(project.deadline)}</p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Project Modal */}
      {createOpen && (
        <CreateProjectModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => setCreateOpen(false)}
        />
      )}

      {/* Edit Project Modal */}
      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onUpdated={() => setEditProject(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Project?</h2>
              <button type="button" className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className="modal-form">
              <p className="text-slate-400 text-sm mb-4">
                Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>?
                This action cannot be undone and will also remove all associated tasks.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn-danger" disabled={deleting} onClick={handleDelete}>
                  {deleting ? "Deleting…" : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
