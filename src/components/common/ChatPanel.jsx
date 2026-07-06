import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast.jsx";
import { getSocket } from "../../api/socket.js";
import { formatDateTime } from "../../utils/helpers.js";
import {
  useGetProjectMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} from "../../features/chat/chatApiSlice.js";

const TYPING_TIMEOUT_MS = 2500;

export default function ChatPanel({ projectId, currentUser, projectRole }) {
  const toast = useToast();
  const { data: history = [], isLoading } = useGetProjectMessagesQuery({ projectId });
  const [sendMessage]   = useSendMessageMutation();
  const [editMessage]   = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // userId -> name
  const [joined, setJoined] = useState(false);

  const scrollRef = useRef(null);
  const typingTimers = useRef({});
  const lastTypingEmit = useRef(0);

  // Seed local message list from REST history once it loads
  useEffect(() => {
    setMessages(history);
  }, [history]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // ── Join project room + live event subscriptions ──────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const doJoin = () => {
      socket.emit("project:join", projectId, (res) => {
        if (!res?.ok) {
          toast({ message: res?.error || "Couldn't connect to live chat", type: "error" });
        } else {
          setJoined(true);
        }
      });
    };

    if (socket.connected) doJoin();
    socket.on("connect", doJoin);

    const handleNewMessage = (msg) => {
      if (Number(msg.project_id) !== Number(projectId)) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // Clear typing indicator for the sender once their message lands
      setTypingUsers((prev) => {
        if (!prev[msg.user_id]) return prev;
        const next = { ...prev };
        delete next[msg.user_id];
        return next;
      });
    };

    const handleEditedMessage = (msg) => {
      if (Number(msg.project_id) !== Number(projectId)) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const handleDeletedMessage = ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    const handleTyping = ({ userId, name }) => {
      if (userId === currentUser?.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: name }));
      clearTimeout(typingTimers.current[userId]);
      typingTimers.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, TYPING_TIMEOUT_MS);
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:message:edited", handleEditedMessage);
    socket.on("chat:message:deleted", handleDeletedMessage);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.emit("project:leave", projectId);
      socket.off("connect", doJoin);
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:message:edited", handleEditedMessage);
      socket.off("chat:message:deleted", handleDeletedMessage);
      socket.off("chat:typing", handleTyping);
      Object.values(typingTimers.current).forEach(clearTimeout);
      setJoined(false);
    };
  }, [projectId, currentUser?.id, toast]);

  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmit.current < 1200) return; // throttle
    lastTypingEmit.current = now;
    getSocket().emit("chat:typing", { projectId });
  }, [projectId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage({ projectId, body }).unwrap();
      // The socket "chat:message" broadcast (including to the sender) appends it —
      // no manual append here to avoid duplicates.
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to send message", type: "error" });
      setDraft(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleEditSave = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await editMessage({ projectId, messageId, body: editText.trim() }).unwrap();
      setEditingId(null);
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to edit message", type: "error" });
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMessage({ projectId, messageId }).unwrap();
    } catch (err) {
      toast({ message: err?.data?.message || "Failed to delete message", type: "error" });
    }
  };

  const typingNames = Object.values(typingUsers);
  const canModerate = ["Owner", "Admin"].includes(projectRole);

  return (
    <div className="rounded-2xl border border-white/6 flex flex-col" style={{ background: "#111827", height: 560 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between shrink-0">
        <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-slate-500">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Project Chat
        </h3>
        <span className={`text-xs flex items-center gap-1.5 ${joined ? "text-emerald-400" : "text-slate-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${joined ? "bg-emerald-400" : "bg-slate-600"}`} />
          {joined ? "Live" : "Connecting…"}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-white/6 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-white/6 rounded" />
                  <div className="h-3 w-48 bg-white/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3 text-xl">💬</div>
            <p className="text-sm text-slate-500">No messages yet. Say hello to the team!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isOwn = m.user_id === currentUser?.id;
              const canDelete = isOwn || canModerate;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 group ${isOwn ? "flex-row-reverse justify-end" : ""}`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: m.color || "#6366f1" }}
                  >
                    {m.initials}
                  </div>
                  <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "flex-row-reverse justify-start" : ""} `}>
                      <span className="text-xs font-semibold text-slate-300">{m.user_name}</span>
                      <span className="text-[11px] text-slate-600">{formatDateTime(m.created_at)}</span>
                      {!!m.edited && <span className="text-[11px] text-slate-700">(edited)</span>}
                    </div>

                    {editingId === m.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          autoFocus
                          className="mf-input w-full text-sm resize-none"
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEditSave(m.id);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(m.id)}
                            className="px-3 py-1 rounded text-xs font-semibold bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <p className={`text-sm break-words whitespace-pre-wrap px-3 py-2 rounded-lg inline-block max-w-xs ${isOwn ? "bg-brand-500/40 text-slate-100" : "text-slate-300"}`}>{m.body}</p>
                        {canDelete && (
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            {isOwn && (
                              <button
                                onClick={() => { setEditingId(m.id); setEditText(m.body); }}
                                title="Edit"
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-brand-400 transition-all"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(m.id)}
                              title="Delete"
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:text-red-400 transition-all"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Typing indicator */}
      <div className="px-4 h-5 shrink-0">
        {typingNames.length > 0 && (
          <p className="text-xs text-slate-600 italic">
            {typingNames.length === 1
              ? `${typingNames[0]} is typing…`
              : `${typingNames.slice(0, 2).join(", ")}${typingNames.length > 2 ? " and others" : ""} are typing…`}
          </p>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/6 flex gap-2 shrink-0">
        <input
          className="mf-input flex-1 text-sm"
          placeholder="Message the team…"
          value={draft}
          maxLength={4000}
          onChange={(e) => { setDraft(e.target.value); emitTyping(); }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50 shrink-0"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
