import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetProjectsQuery } from "../../features/projects/projectApiSlice.js";
import { useGetTasksQuery } from "../../features/tasks/taskApiSlice.js";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import { StatCard, StatusBadge, PriorityBadge, ProgressBar, AvatarGroup, CardSkeleton } from "../../components/ui/index.jsx";
import { formatDate } from "../../utils/helpers.js";
import { Icon, ProjectIcon } from "../../components/common/icons.jsx";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const currentUser = useSelector(selectCurrentUser);
  const { data: projectsRes = {}, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: tasksRes    = {}, isLoading: tasksLoading    } = useGetTasksQuery();

  const projects = projectsRes.data ?? (Array.isArray(projectsRes) ? projectsRes : []);
  const tasks    = tasksRes.data    ?? (Array.isArray(tasksRes)    ? tasksRes    : []);

  const activeProjects  = projects.filter((p) => p.status === "In Progress").length;
  const completedTasks  = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const overallProgress = projects.length
    ? Math.round(projects.reduce((a, p) => a + (p.progress || 0), 0) / projects.length)
    : 0;

  const recentProjects = projects.slice(0, 4);
  const myTasks = tasks
    .filter((t) => t.assignee_id === currentUser?.id || t.assigneeId === currentUser?.id)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            Good morning, {currentUser?.name?.split(" ")[0]}
            <Icon name="hand" className="w-5 h-5 text-amber-300" />
          </h2>
          <p className="text-slate-500 mt-1">Here's what's happening across your projects today.</p>
        </div>
        <Link to="/projects" className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors">
          View all projects →
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Active Projects",    value: projectsLoading ? "—" : activeProjects,  change:12, color:"#6366f1",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 7a2 2 0 0 1 2-2h3l2 3h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg> },
          { label:"Tasks In Progress",  value: tasksLoading ? "—" : inProgressTasks,   change:5,  color:"#8b5cf6",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label:"Tasks Completed",    value: tasksLoading ? "—" : completedTasks,    change:18, color:"#10b981",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label:"Avg. Progress",      value: projectsLoading ? "—" : `${overallProgress}%`, change:-3, color:"#f59e0b",
            icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}><StatCard {...stat} /></motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">Recent Projects</h3>
            <Link to="/projects" className="text-xs text-slate-500 hover:text-brand-400 transition-colors">See all</Link>
          </div>
          <div className="space-y-3">
            {projectsLoading
              ? [0,1,2].map((i) => <CardSkeleton key={i}/>)
              : recentProjects.map((project, i) => (
                <motion.div key={project.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}>
                  <Link to={`/projects/${project.id}`}>
                    <div className="rounded-2xl p-4 border border-white/6 hover:border-white/12 transition-all group cursor-pointer" style={{ background:"#111827" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background:`${project.color}18`, border:`1px solid ${project.color}30`, color: project.color || "#6366f1" }}>
                            <ProjectIcon icon={project.icon} className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{project.name}</p>
                            <p className="text-xs text-slate-600">{project.category}</p>
                          </div>
                        </div>
                        <StatusBadge status={project.status}/>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">{project.completed_task_count ?? project.completedTaskCount ?? 0}/{project.task_count ?? project.taskCount ?? 0} tasks</span>
                        <span className="text-xs font-semibold text-slate-400">{project.progress ?? 0}%</span>
                      </div>
                      <ProgressBar value={project.progress ?? 0} color={project.color}/>
                      <div className="flex items-center justify-between mt-3">
                        <AvatarGroup users={project.members ?? []}/>
                        <span className="text-xs text-slate-600">Due {formatDate(project.deadline)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">My Tasks</h3>
            <Link to="/tasks" className="text-xs text-slate-500 hover:text-brand-400 transition-colors">See all</Link>
          </div>
          <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background:"#111827" }}>
            {tasksLoading
              ? <div className="p-4 space-y-3">{[0,1,2,3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-4 h-4 rounded mt-0.5 flex-shrink-0"/>
                    <div className="flex-1 space-y-1.5"><div className="skeleton h-4 w-full rounded"/><div className="skeleton h-3 w-2/3 rounded"/></div>
                  </div>))}</div>
              : myTasks.length === 0
              ? <div className="py-10 text-center"><p className="text-slate-500 text-sm">No tasks assigned to you</p></div>
              : myTasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
                  className="flex items-start gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors cursor-pointer">
                  <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 flex-shrink-0 ${task.status === "Done" ? "bg-emerald-500" : "border-2 border-slate-600"}`}>
                    {task.status === "Done" && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${task.status === "Done" ? "line-through text-slate-600" : "text-slate-300"}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PriorityBadge priority={task.priority}/>
                      <span className="text-xs text-slate-600">{formatDate(task.due_date ?? task.dueDate)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
