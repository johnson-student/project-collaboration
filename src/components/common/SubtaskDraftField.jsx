import { useState } from "react";
import { formatDate } from "../../utils/helpers.js";
import { Icon } from "./icons.jsx";

export const EMPTY_SUBTASK_DRAFT = { title: "", description: "", priority: "Medium", dueDate: "" };

// Drafts subtasks inside a create-task form, before the parent task exists.
// The caller owns the drafts array and creates them via the subtasks API
// after the task itself is created.
export default function SubtaskDraftField({ drafts, onChange }) {
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_SUBTASK_DRAFT);

  const closeForm = () => { setFormOpen(false); setDraft(EMPTY_SUBTASK_DRAFT); };

  const addDraft = () => {
    if (!draft.title.trim()) return;
    onChange([...drafts, { ...draft, title: draft.title.trim() }]);
    closeForm();
  };

  return (
    <div className="mf-field">
      <label className="mf-label">Subtasks</label>

      {/* Drafted subtasks */}
      {drafts.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {drafts.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white/4 border border-white/8 px-3 py-2">
              <span className="w-3.5 h-3.5 rounded border border-white/20 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{s.title}</p>
                {s.description && <p className="text-xs text-slate-500 truncate">{s.description}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold ${s.priority === "High" ? "text-red-400" : s.priority === "Low" ? "text-emerald-400" : "text-amber-400"}`}>
                    {s.priority}
                  </span>
                  {s.dueDate && (
                    <span className="text-[10px] text-slate-500">Due {formatDate(s.dueDate)}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                title="Remove subtask"
                onClick={() => onChange(drafts.filter((_, idx) => idx !== i))}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-red-400 transition-all shrink-0"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Draft form / add button */}
      {formOpen ? (
        <div
          className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-2"
          onKeyDown={e => {
            if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); addDraft(); }
            if (e.key === "Escape") closeForm();
          }}
        >
          <input
            autoFocus
            className="mf-input"
            style={{ marginBottom: 0 }}
            placeholder="What needs to be done?"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          />
          <textarea
            className="mf-input mf-textarea"
            style={{ marginBottom: 0 }}
            rows="2"
            placeholder="Add more detail (optional)"
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mf-label" style={{ fontSize: ".7rem" }}>Due date</label>
              <input
                type="date"
                className="mf-input"
                style={{ marginBottom: 0 }}
                value={draft.dueDate}
                onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="mf-label" style={{ fontSize: ".7rem" }}>Priority</label>
              <select
                className="mf-input mf-select"
                style={{ marginBottom: 0 }}
                value={draft.priority}
                onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}
              >
                {["Low", "Medium", "High"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeForm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draft.title.trim()}
              onClick={addDraft}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50"
            >
              Add Subtask
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-brand-300 border border-dashed border-white/10 hover:border-brand-500/30 transition-all flex items-center justify-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add a subtask
        </button>
      )}
    </div>
  );
}
