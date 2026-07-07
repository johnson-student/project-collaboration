import { useState } from "react";
import { useToast } from "./Toast.jsx";
import {
  useGetTaskByIdQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
} from "../../features/tasks/taskApiSlice.js";
import { formatDateTime } from "../../utils/helpers.js";

// Comment thread for a task. Fetches the task itself (RTK Query dedupes with
// any other useGetTaskByIdQuery(taskId) subscriber on the page).
export default function TaskComments({ taskId, currentUser }) {
  const toast = useToast();
  const { data: task, isLoading } = useGetTaskByIdQuery(taskId, { skip: !taskId });
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [addComment,    { isLoading: adding }]   = useAddCommentMutation();
  const [editComment,   { isLoading: editing }]  = useEditCommentMutation();
  const [deleteComment, { isLoading: deleting }] = useDeleteCommentMutation();

  const comments = task?.comments ?? [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment({ taskId, comment: newComment.trim() }).unwrap();
      setNewComment("");
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to add comment", type: "error" });
    }
  };

  const handleEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await editComment({ taskId, commentId, comment: editText.trim() }).unwrap();
      setEditingId(null);
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to edit comment", type: "error" });
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment({ taskId, commentId }).unwrap();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to delete comment", type: "error" });
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-slate-500">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Comments ({comments.length})
      </h4>
      <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
        {isLoading && <p className="text-xs text-slate-600 italic">Loading comments…</p>}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: c.color || "#6366f1" }}
            >
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-300">{c.user_name}</span>
                <span className="text-xs text-slate-600">{formatDateTime(c.created_at)}</span>
                {c.updated_at !== c.created_at && <span className="text-xs text-slate-700">(edited)</span>}
              </div>
              {editingId === c.id ? (
                <div className="space-y-2">
                  <textarea
                    className="mf-input w-full text-sm resize-none"
                    rows={2}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c.id)} disabled={editing} className="px-3 py-1 rounded text-xs font-semibold bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-all disabled:opacity-50">
                      {editing ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 break-words">{c.body}</p>
              )}
            </div>
            {c.user_id === currentUser?.id && editingId !== c.id && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingId(c.id); setEditText(c.body); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-brand-400 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(c.id)} disabled={deleting} className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-red-400 transition-all disabled:opacity-50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
        {!isLoading && comments.length === 0 && <p className="text-xs text-slate-600 italic">No comments yet.</p>}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="mf-input flex-1 text-sm"
          placeholder="Add a comment…"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button type="submit" disabled={adding || !newComment.trim()} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50">
          {adding ? "…" : "Post"}
        </button>
      </form>
    </div>
  );
}
