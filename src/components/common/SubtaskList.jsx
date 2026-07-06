import { useState, useEffect, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import {
  useGetSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useReorderSubtasksMutation,
} from '../../features/tasks/taskApiSlice.js';
import { ProgressBar } from '../../components/ui/index.jsx';
import './modal.css';

// Subtasks have no assignee of their own — ownership is inherited from the parent task.
const EMPTY_FORM = { title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' };

function fmtDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toDateInput(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v).split('T')[0];
}

function isOverdue(v) {
  if (!v) return false;
  const d = new Date(toDateInput(v) + 'T23:59:59');
  return !isNaN(d) && d < new Date();
}

// ── Icons ───────────────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PriorityBadge({ priority }) {
  const p = (priority || 'Medium').toLowerCase();
  return <span className={`stk-badge stk-badge-${p}`}>{priority}</span>;
}

// ── Shared subtask form — used for both inline create and edit ─────────────
function SubtaskForm({ form, setForm, onCancel, onSave, saveLabel, showStatus = false }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      onSave();
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="stk-form" onKeyDown={handleKeyDown}>
      <div>
        <label className="stk-form-label">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="mf-input"
          placeholder="What needs to be done?"
          style={{ marginBottom: 0 }}
          autoFocus
        />
      </div>
      <div>
        <label className="stk-form-label">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mf-input mf-textarea"
          placeholder="Add more detail (optional)"
          rows="2"
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className="stk-form-row">
        {showStatus && (
          <div>
            <label className="stk-form-label">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mf-input mf-select"
              style={{ marginBottom: 0 }}
            >
              <option>Todo</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
        )}
        <div>
          <label className="stk-form-label">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="mf-input"
            style={{ marginBottom: 0 }}
          />
        </div>
        <div>
          <label className="stk-form-label">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="mf-input mf-select"
            style={{ marginBottom: 0 }}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>
      <div className="stk-form-footer">
        <button onClick={onCancel} className="btn-ghost" style={{ padding: '.4rem .8rem', fontSize: '.8rem', marginBottom: 0 }}>
          Cancel
        </button>
        <button onClick={onSave} className="btn-primary" style={{ padding: '.4rem .8rem', fontSize: '.8rem', marginBottom: 0 }}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ── Single subtask card content — rendered *inside* a Reorder.Item ─────────
// Note: this must be used as a child of <Reorder.Item>, not return one itself.
// Reorder.Group requires Reorder.Item to be its direct JSX child; delegating
// that element to a wrapping component breaks its drag/position tracking and
// causes an infinite reorder/render loop.
function SubtaskCardContent({ subtask, isEditing, editForm, setEditForm, onToggle, onStartEdit, onCancelEdit, onSave, onDelete }) {
  const done = subtask.status === 'Done';
  const dueLabel = fmtDate(subtask.due_date);
  const overdue = !done && isOverdue(subtask.due_date);

  if (isEditing) {
    return <SubtaskForm form={editForm} setForm={setEditForm} onCancel={onCancelEdit} onSave={onSave} saveLabel="Save" showStatus />;
  }

  return (
    <div className={`stk-card${done ? ' stk-card-done' : ''}`}>
      <span title="Drag to reorder" className="stk-grip"><GripIcon /></span>

      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        onClick={() => onToggle(subtask)}
        className={`stk-check${done ? ' stk-check-done' : ''}`}
      >
        <AnimatePresence>
          {done && (
            <motion.svg
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="11" height="11"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      <div className="stk-body">
        <span className={`stk-title${done ? ' stk-title-done' : ''}`}>{subtask.title}</span>
        {subtask.description && <span className="stk-desc">{subtask.description}</span>}
        {(dueLabel || subtask.priority) && (
          <div className="stk-meta">
            {dueLabel && (
              <span className={`stk-due${overdue ? ' stk-due-overdue' : ''}`}>
                <CalendarIcon /> {dueLabel}
              </span>
            )}
            <PriorityBadge priority={subtask.priority} />
          </div>
        )}
      </div>

      <div className="stk-actions">
        <button onClick={() => onStartEdit(subtask)} title="Edit" className="stk-icon-btn"><PencilIcon /></button>
        <button onClick={() => onDelete(subtask.id)} title="Delete" className="stk-icon-btn stk-icon-btn-danger"><TrashIcon /></button>
      </div>
    </div>
  );
}

export default function SubtaskList({ taskId }) {
  const { data: subtasksData = [], isLoading } = useGetSubtasksQuery(taskId);
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [reorderSubtasks] = useReorderSubtasksMutation();

  const serverItems = Array.isArray(subtasksData)
    ? subtasksData
    : subtasksData?.data ?? [];

  const [items, setItems] = useState(serverItems);
  useEffect(() => { setItems(serverItems); }, [subtasksData]);

  const pendingOrder = useRef(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  const handleReorder = (newOrder) => {
    setItems(newOrder);
    pendingOrder.current = newOrder;
  };

  const handleDragEnd = async () => {
    const newOrder = pendingOrder.current;
    if (!newOrder) return;
    pendingOrder.current = null;
    try {
      await reorderSubtasks({
        taskId,
        order: newOrder.map((s, i) => ({ id: s.id, position: i })),
      }).unwrap();
    } catch {
      setItems(serverItems);
    }
  };

  // ── Create ───────────────────────────────────────────────────────────────
  const openAddForm = () => {
    setError('');
    setEditingId(null);
    setAddForm(EMPTY_FORM);
    setShowAddForm(true);
  };

  const cancelAddForm = () => { setShowAddForm(false); setAddForm(EMPTY_FORM); };

  const handleCreate = async () => {
    setError('');
    if (!addForm.title.trim()) { setError('Subtask title is required'); return; }
    try {
      await createSubtask({
        taskId,
        title: addForm.title,
        description: addForm.description || null,
        priority: addForm.priority,
        dueDate: addForm.dueDate || null,
      }).unwrap();
      cancelAddForm();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create subtask');
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = (s) => {
    setError('');
    setShowAddForm(false);
    setEditingId(s.id);
    setEditForm({
      title: s.title,
      description: s.description || '',
      status: s.status,
      priority: s.priority || 'Medium',
      dueDate: toDateInput(s.due_date),
    });
  };

  const cancelEdit = () => { setEditingId(null); setError(''); };

  const handleUpdate = async () => {
    setError('');
    if (!editForm.title.trim()) { setError('Subtask title is required'); return; }
    try {
      await updateSubtask({
        taskId,
        subtaskId: editingId,
        title: editForm.title,
        description: editForm.description || null,
        status: editForm.status,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      }).unwrap();
      cancelEdit();
    } catch (err) {
      setError(err?.data?.message || 'Failed to update subtask');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (subtaskId) => {
    if (!window.confirm('Delete this subtask?')) return;
    try {
      await deleteSubtask({ taskId, subtaskId }).unwrap();
    } catch (err) {
      setError(err?.data?.message || 'Failed to delete subtask');
    }
  };

  // ── Completion toggle ────────────────────────────────────────────────────
  const toggleDone = async (s) => {
    try {
      await updateSubtask({ taskId, subtaskId: s.id, status: s.status === 'Done' ? 'Todo' : 'Done' }).unwrap();
    } catch {
      // RTK Query cache already reflects the source of truth on refetch
    }
  };

  if (isLoading) {
    return (
      <div className="stk-wrap" style={{ color: '#6b7280', fontSize: '.85rem' }}>
        Loading subtasks…
      </div>
    );
  }

  const doneCount = items.filter((s) => s.status === 'Done').length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="stk-wrap">

      {/* ── Header + progress ─────────────────────────────────────────────── */}
      <h3 className="stk-heading">Subtasks{items.length > 0 && <span className="stk-count">{doneCount}/{items.length}</span>}</h3>

      {items.length > 0 && (
        <div className="stk-progress">
          <div className="stk-progress-row">
            <ProgressBar value={pct} className="flex-1" />
            <span className="stk-progress-pct">{pct}%</span>
          </div>
          <span className="stk-progress-count">
            {doneCount} of {items.length} completed
          </span>
        </div>
      )}

      {error && (
        <div className="stk-error">{error}</div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!items.length && !showAddForm && (
        <div className="stk-empty">
          <span className="stk-empty-title">No subtasks yet</span>
          <span className="stk-empty-sub">Break this task into smaller steps.</span>
          <button onClick={openAddForm} className="btn-primary" style={{ padding: '.45rem .9rem', fontSize: '.8rem', marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
            <PlusIcon /> Create First Subtask
          </button>
        </div>
      )}

      {/* ── Subtask cards ─────────────────────────────────────────────────── */}
      {/* Reorder.Item must be a direct JSX child of Reorder.Group — delegating
          it to a wrapping component (or using a separate dragControls handle
          via useDragControls) breaks its drag/position tracking and causes an
          infinite reorder/render loop with this framer-motion version. */}
      {items.length > 0 && (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} as="div" className="stk-list">
          <AnimatePresence initial={false}>
            {items.map((subtask) => (
              <Reorder.Item
                key={subtask.id}
                value={subtask}
                as="div"
                dragListener={editingId !== subtask.id}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                whileDrag={{ scale: 1.015, boxShadow: '0 8px 24px rgba(0,0,0,.35)' }}
                style={{ borderRadius: '10px', cursor: editingId === subtask.id ? 'default' : 'grab' }}
              >
                <SubtaskCardContent
                  subtask={subtask}
                  isEditing={editingId === subtask.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onToggle={toggleDone}
                  onStartEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onSave={handleUpdate}
                  onDelete={handleDelete}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* ── Add subtask ───────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showAddForm ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <SubtaskForm form={addForm} setForm={setAddForm} onCancel={cancelAddForm} onSave={handleCreate} saveLabel="Create Subtask" />
          </motion.div>
        ) : items.length > 0 ? (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={openAddForm}
            className="stk-add-btn"
          >
            <PlusIcon /> Add a subtask
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
