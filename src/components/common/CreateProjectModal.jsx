import { useState } from "react";
import { useSelector } from "react-redux";
import { useCreateProjectMutation } from "../../features/projects/projectApiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice.js";
import MemberPicker from "./MemberPicker";
import "./MemberPicker.css";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];
const ICONS = [
  "🚀",
  "💡",
  "🎯",
  "📊",
  "🔧",
  "🎨",
  "📱",
  "🌐",
  "⚡",
  "🔬",
  "📚",
  "🎮",
];

export default function CreateProjectModal({ onClose, onCreated }) {
  const [createProject, { isLoading }] = useCreateProjectMutation();
  const currentUser = useSelector(selectCurrentUser);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    deadline: "",
    color: "#6366f1",
    icon: "🚀",
    category: "General",
  });
  const [members, setMembers] = useState([]); // array of user objects
  const [error, setError] = useState("");

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Project name is required.");
    try {
      const data = await createProject({
        ...form,
        deadline: form.deadline || undefined,
        memberIds: members.map((m) => m.id),
      }).unwrap();
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to create project.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Create Project</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={submit} className="modal-form">
          {/* Name */}
          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Project name *</label>
              <input
                name="name"
                required
                className="mf-input"
                placeholder="e.g. Mobile App Redesign"
                value={form.name}
                onChange={handle}
              />
            </div>
            {/* Icon picker */}
            <div className="mf-field">
              <label className="mf-label">Icon</label>
              <select
                name="icon"
                className="mf-input mf-select"
                value={form.icon}
                onChange={handle}
              >
                {ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mf-field">
            <label className="mf-label">Description</label>
            <textarea
              name="description"
              className="mf-input mf-textarea"
              placeholder="What is this project about?"
              rows={3}
              value={form.description}
              onChange={handle}
            />
          </div>

          {/* Status + Priority */}
          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Status</label>
              <select
                name="status"
                className="mf-input mf-select"
                value={form.status}
                onChange={handle}
              >
                {[
                  "Planning",
                  "In Progress",
                  "Review",
                  "On Hold",
                  "Completed",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Priority</label>
              <select
                name="priority"
                className="mf-input mf-select"
                value={form.priority}
                onChange={handle}
              >
                {["Low", "Medium", "High", "Critical"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline + Category */}
          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Deadline</label>
              <input
                name="deadline"
                type="date"
                className="mf-input"
                value={form.deadline}
                onChange={handle}
              />
            </div>
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Category</label>
              <input
                name="category"
                className="mf-input"
                placeholder="e.g. Engineering"
                value={form.category}
                onChange={handle}
              />
            </div>
          </div>

          {/* Color */}
          <div className="mf-field">
            <label className="mf-label">Color</label>
            <div className="mf-colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`mf-color-dot${form.color === c ? " mf-color-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>

          {/* Members picker */}
          <div className="mf-field">
            <label className="mf-label">Invite members (optional)</label>
            <p className="text-xs text-slate-500 mb-2 -mt-1">
              They'll receive an invitation and join once they accept.
            </p>
            <MemberPicker
              currentUserId={currentUser?.id}
              selected={members}
              onChange={setMembers}
              placeholder="Search users to invite…"
            />
            {members.length > 0 && (
              <div className="mf-member-chips">
                {members.map((m) => (
                  <span key={m.id} className="mf-chip">
                    <span
                      className="mf-chip-av"
                      style={{ background: m.color || "#6366f1" }}
                    >
                      {m.initials}
                    </span>
                    {m.name}
                    <button
                      type="button"
                      className="mf-chip-rm"
                      onClick={() =>
                        setMembers((ms) => ms.filter((x) => x.id !== m.id))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Creating…" : `Create Project${members.length ? ` & Invite ${members.length}` : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
