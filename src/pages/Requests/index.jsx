import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useToast } from "../../components/common/Toast.jsx";
import { useGetMyInvitationsQuery, useRespondToInvitationMutation } from "../../features/invitations/invitationApiSlice.js";
import { useGetMyAssignmentRequestsQuery, useRespondToAssignmentMutation } from "../../features/assignments/assignmentApiSlice.js";
import { Avatar } from "../../components/ui/index.jsx";
import { formatDate } from "../../utils/helpers.js";

function StatusPill({ status }) {
  const cfg = {
    Pending:  { bg: "bg-yellow-400/10",  text: "text-yellow-400",  label: "Pending" },
    Accepted: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Accepted" },
    Rejected: { bg: "bg-red-400/10",     text: "text-red-400",     label: "Rejected" },
  }[status] || { bg: "bg-slate-400/10", text: "text-slate-400", label: status };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function InvitationCard({ inv, onRespond }) {
  const [responding, setResponding] = useState(null);
  const isPending = inv.status === "Pending";

  const handle = async (action) => {
    setResponding(action);
    try { await onRespond({ id: inv.id, action }); }
    finally { setResponding(null); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-5 border border-white/6 flex items-start gap-4"
      style={{ background: "#111827" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: `${inv.project_color || "#6366f1"}18`, border: `1px solid ${inv.project_color || "#6366f1"}25` }}
      >
        {inv.project_icon || "🚀"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="font-semibold text-white truncate">{inv.project_name}</p>
          <StatusPill status={inv.status} />
        </div>
        <p className="text-sm text-slate-400 mb-1">
          <span className="text-slate-300">{inv.inviter_name}</span> invited you as <span className="text-brand-300">{inv.role}</span>
        </p>
        <p className="text-xs text-slate-600">{formatDate(inv.created_at)}</p>
        {isPending && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handle("accept")}
              disabled={!!responding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {responding === "accept" ? "Accepting…" : "✓ Accept"}
            </button>
            <button
              onClick={() => handle("reject")}
              disabled={!!responding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {responding === "reject" ? "Rejecting…" : "✕ Reject"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AssignmentCard({ req, onRespond }) {
  const [responding, setResponding] = useState(null);
  const isPending = req.status === "Pending";

  const handle = async (action) => {
    setResponding(action);
    try { await onRespond({ id: req.id, action }); }
    finally { setResponding(null); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-5 border border-white/6 flex items-start gap-4"
      style={{ background: "#111827" }}
    >
      <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="font-semibold text-white truncate">{req.task_title}</p>
          <StatusPill status={req.status} />
        </div>
        {req.project_name && (
          <p className="text-xs text-slate-500 mb-1">
            <span style={{ color: req.project_color }}>{req.project_icon}</span> {req.project_name}
          </p>
        )}
        <p className="text-sm text-slate-400 mb-1">
          <span className="text-slate-300">{req.requester_name}</span> wants to assign this task to you
        </p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-600">Priority:</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            req.priority === "High" ? "bg-red-500/15 text-red-400" :
            req.priority === "Medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-slate-500/15 text-slate-400"
          }`}>{req.priority}</span>
        </div>
        <p className="text-xs text-slate-600">{formatDate(req.created_at)}</p>
        {isPending && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handle("accept")}
              disabled={!!responding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {responding === "accept" ? "Accepting…" : "✓ Accept"}
            </button>
            <button
              onClick={() => handle("reject")}
              disabled={!!responding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {responding === "reject" ? "Rejecting…" : "✕ Reject"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function RequestsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("invitations");

  const { data: invitations = [], isLoading: invLoading, refetch: refetchInv } = useGetMyInvitationsQuery();
  const { data: assignments = [], isLoading: assLoading, refetch: refetchAss } = useGetMyAssignmentRequestsQuery();
  const [respondInv] = useRespondToInvitationMutation();
  const [respondAss] = useRespondToAssignmentMutation();

  const pendingInv = invitations.filter(i => i.status === "Pending").length;
  const pendingAss = assignments.filter(a => a.status === "Pending").length;

  const handleInvResponse = async ({ id, action }) => {
    try {
      await respondInv({ id, action }).unwrap();
      toast({ message: `Invitation ${action === "accept" ? "accepted! You've joined the project." : "declined."}`, type: action === "accept" ? "success" : "success" });
      refetchInv();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to respond", type: "error" });
    }
  };

  const handleAssResponse = async ({ id, action }) => {
    try {
      await respondAss({ id, action }).unwrap();
      toast({ message: `Task assignment ${action === "accept" ? "accepted!" : "declined."}`, type: "success" });
      refetchAss();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to respond", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-2xl mb-1">Requests & Invitations</h1>
        <p className="text-slate-500 text-sm">Review and respond to project invitations and task assignments.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/6 pb-0">
        {[
          { key: "invitations", label: "Project Invitations", count: pendingInv },
          { key: "assignments", label: "Task Assignments", count: pendingAss },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              tab === key
                ? "bg-brand-500/15 text-brand-300 border border-brand-500/25 border-b-0"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
            {count > 0 && (
              <span className="text-xs font-bold bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "invitations" && (
        <div className="space-y-3">
          {invLoading ? (
            <div className="text-slate-500 text-sm">Loading…</div>
          ) : invitations.length === 0 ? (
            <div className="rounded-2xl p-12 border border-white/6 text-center" style={{ background: "#111827" }}>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">📬</div>
              <p className="font-semibold text-white mb-1">No invitations</p>
              <p className="text-slate-500 text-sm">When someone invites you to a project, it will appear here.</p>
            </div>
          ) : (
            <AnimatePresence>
              {invitations.map(inv => (
                <InvitationCard key={inv.id} inv={inv} onRespond={handleInvResponse} />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {tab === "assignments" && (
        <div className="space-y-3">
          {assLoading ? (
            <div className="text-slate-500 text-sm">Loading…</div>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl p-12 border border-white/6 text-center" style={{ background: "#111827" }}>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">📋</div>
              <p className="font-semibold text-white mb-1">No task assignments</p>
              <p className="text-slate-500 text-sm">When someone assigns a task to you, it will appear here.</p>
            </div>
          ) : (
            <AnimatePresence>
              {assignments.map(req => (
                <AssignmentCard key={req.id} req={req} onRespond={handleAssResponse} />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
