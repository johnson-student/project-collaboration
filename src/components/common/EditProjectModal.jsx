import { useState, useEffect } from "react";
import { useUpdateProjectMutation } from "../../features/projects/projectApiSlice";
import MemberPicker from "./MemberPicker";
import "./MemberPicker.css";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#06b6d4","#10b981","#f59e0b","#ef4444"];
const ICONS  = ["🚀","💡","🎯","📊","🔧","🎨","📱","🌐","⚡","🔬","📚","🎮"];

export default function EditProjectModal({ project, onClose, onUpdated }) {
  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  const [form, setForm] = useState({
    name: "", description: "", status: "Planning", priority: "Medium",
    deadline: "", color: "#6366f1", icon: "🚀", category: "General",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Prefill form when project loads
  useEffect(() => {
    if (project) {
      setForm({
        name:        project.name        || "",
        description: project.description || "",
        status:      project.status      || "Planning",
        priority:    project.priority    || "Medium",
        deadline:    project.deadline    ? project.deadline.split("T")[0] : "",
        color:       project.color       || "#6366f1",
        icon:        project.icon        || "🚀",
        category:    project.category    || "General",
      });
    }
  }, [project]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Project name is required.");
    try {
      const updated = await updateProject({
        id: project.id,
        ...form,
        deadline: form.deadline || null,
      }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        onUpdated?.(updated);
        onClose();
      }, 600);
    } catch (err) {
      setError(err?.data?.message || "Failed to update project.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Edit Project</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error   && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">Project updated!</div>}

        <form onSubmit={submit} className="modal-form">
          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Project name *</label>
              <input name="name" required className="mf-input" placeholder="e.g. Mobile App Redesign"
                value={form.name} onChange={handle}/>
            </div>
            <div className="mf-field">
              <label className="mf-label">Icon</label>
              <select name="icon" className="mf-input mf-select" value={form.icon} onChange={handle}>
                {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </div>

          <div className="mf-field">
            <label className="mf-label">Description</label>
            <textarea name="description" className="mf-input mf-textarea" placeholder="What is this project about?"
              rows={3} value={form.description} onChange={handle}/>
          </div>

          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Status</label>
              <select name="status" className="mf-input mf-select" value={form.status} onChange={handle}>
                {["Planning","In Progress","Review","On Hold","Completed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Priority</label>
              <select name="priority" className="mf-input mf-select" value={form.priority} onChange={handle}>
                {["Low","Medium","High","Critical"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Deadline</label>
              <input name="deadline" type="date" className="mf-input" value={form.deadline} onChange={handle}/>
            </div>
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Category</label>
              <input name="category" className="mf-input" placeholder="e.g. Engineering"
                value={form.category} onChange={handle}/>
            </div>
          </div>

          <div className="mf-field">
            <label className="mf-label">Color</label>
            <div className="mf-colors">
              {COLORS.map((c) => (
                <button key={c} type="button"
                  className={`mf-color-dot${form.color === c ? " mf-color-active" : ""}`}
                  style={{background: c}}
                  onClick={() => setForm((f) => ({...f, color: c}))}/>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
