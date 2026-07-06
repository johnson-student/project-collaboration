import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useUpdateTaskMutation } from '../../features/tasks/taskApiSlice';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import MemberPicker from './MemberPicker';
import SubtaskList from './SubtaskList';
import './MemberPicker.css';

/**
 * EditTaskModal
 * Props:
 *   task      - existing task object (prefills form)
 *   projectId - used to scope assignee search to project members
 *   onClose   - close handler
 *   onUpdated - called after successful save
 */
export default function EditTaskModal({ task, projectId, onClose, onUpdated }) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const currentUser = useSelector(selectCurrentUser);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dueDate: '',
    tags: '',
    assignee: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        dueDate:
          (task.due_date ?? task.dueDate)
            ? (task.due_date ?? task.dueDate).split('T')[0]
            : '',
        tags: task.tags?.join(', ') || '',
        assignee: task.assignee_name
          ? {
              id: task.assignee_id,
              name: task.assignee_name,
              initials: task.assignee_initials,
              color: task.assignee_color,
              avatar: task.assignee_avatar,
            }
          : null,
      });
    }
  }, [task]);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    try {
      const updated = await updateTask({
        id: task.id,
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assignee?.id || null,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        onUpdated?.(updated);
        onClose();
      }, 600);
    } catch (err) {
      setError(err?.data?.message || 'Failed to update task.');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">Task updated!</div>}

        <form onSubmit={submit} className="modal-form">
          <div className="mf-field">
            <label className="mf-label">Title *</label>
            <input
              name="title"
              required
              className="mf-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={handle}
            />
          </div>

          <div className="mf-field">
            <label className="mf-label">Description</label>
            <textarea
              name="description"
              className="mf-input mf-textarea"
              rows={3}
              placeholder="Optional details…"
              value={form.description}
              onChange={handle}
            />
          </div>

          <div className="mf-row">
            <div className="mf-field mf-field-grow">
              <label className="mf-label">Status</label>
              <select
                name="status"
                className="mf-input mf-select"
                value={form.status}
                onChange={handle}
              >
                {['Todo', 'In Progress', 'Review', 'Done'].map((s) => (
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
                {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mf-field">
            <label className="mf-label">Due date</label>
            <input
              name="dueDate"
              type="date"
              className="mf-input"
              value={form.dueDate}
              onChange={handle}
            />
          </div>

          <div className="mf-field">
            <label className="mf-label">
              Assignee {projectId ? '(project members only)' : ''}
            </label>
            <MemberPicker
              projectId={projectId}
              scope="project-members"
              currentUserId={currentUser?.id}
              single
              selected={form.assignee ? [form.assignee] : []}
              onChange={(arr) =>
                setForm((f) => ({ ...f, assignee: arr[0] ?? null }))
              }
              placeholder="Select member…"
            />
          </div>

          <div className="mf-field">
            <label className="mf-label">Tags (comma-separated)</label>
            <input
              name="tags"
              className="mf-input"
              placeholder="frontend, bug, api…"
              value={form.tags}
              onChange={handle}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {task?.id && <SubtaskList taskId={task.id} />}
      </div>
    </div>
  );
}
