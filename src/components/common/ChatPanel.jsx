import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast.jsx";
import { getSocket } from "../../api/socket.js";
import { formatTime, formatChatDate, resolveAssetUrl } from "../../utils/helpers.js";
import { Icon } from "./icons.jsx";
import MarkdownMessage from "./MarkdownMessage.jsx";
import {
  useGetProjectMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} from "../../features/chat/chatApiSlice.js";
import { fileApiSlice } from "../../features/files/fileApiSlice.js";

const TYPING_TIMEOUT_MS = 2500;

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const attachmentUrl = (m) => resolveAssetUrl(`/uploads/project-files/${m.attachment_stored_name}`);

function downloadAttachment(m, onError) {
  fetch(attachmentUrl(m))
    .then((r) => (r.ok ? r.blob() : Promise.reject()))
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m.attachment_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(() => onError?.());
}

function MessageAttachment({ m, onError }) {
  const isImage = m.attachment_mime?.startsWith("image/");
  const isAudio = m.attachment_mime?.startsWith("audio/");
  if (isAudio) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-slate-300">
          <Icon name="mic" className="w-4 h-4" />
        </span>
        <audio controls preload="metadata" src={attachmentUrl(m)} className="h-9" style={{ width: 200 }} />
      </div>
    );
  }
  if (isImage) {
    return (
      <img
        src={attachmentUrl(m)}
        alt={m.attachment_name}
        loading="lazy"
        onClick={() => window.open(attachmentUrl(m), "_blank", "noopener")}
        className="rounded-lg max-h-48 max-w-full object-cover cursor-zoom-in block mb-1"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => downloadAttachment(m, onError)}
      title="Download"
      className="flex items-center gap-2 w-full rounded-lg bg-black/20 hover:bg-black/30 transition-all px-2.5 py-2 mb-1 text-left"
    >
      <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-slate-300">
        <Icon name="paperclip" className="w-4 h-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-200 truncate">{m.attachment_name}</span>
        <span className="block text-[10px] text-slate-400">{formatFileSize(m.attachment_size)}</span>
      </span>
    </button>
  );
}

export default function ChatPanel({ projectId, currentUser, projectRole }) {
  const toast = useToast();
  const dispatch = useDispatch();
  const { data: history = [], isLoading } = useGetProjectMessagesQuery(
    { projectId },
    { refetchOnMountOrArgChange: true }
  );
  const [sendMessage]   = useSendMessageMutation();
  const [editMessage]   = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null); // File pending upload
  const [attachmentPreview, setAttachmentPreview] = useState(null); // blob: url for images
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // userId -> name
  const [joined, setJoined] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimers = useRef({});
  const lastTypingEmit = useRef(0);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const discardRecordingRef = useRef(false);

  const pickAttachment = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ message: "File is too large (max 50 MB)", type: "error" });
      return;
    }
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(file);
    setAttachmentPreview(
      file.type.startsWith("image/") || file.type.startsWith("audio/") ? URL.createObjectURL(file) : null
    );
  };

  const clearAttachment = useCallback(() => {
    setAttachment(null);
    setAttachmentPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // ── Voice messages ─────────────────────────────────────────
  const startRecording = async () => {
    if (recording || sending) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({ message: "Microphone access is needed to record a voice message", type: "error" });
      return;
    }
    // Chrome/Firefox record webm/opus; Safari records mp4 (m4a)
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
      (t) => window.MediaRecorder?.isTypeSupported?.(t)
    );
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      toast({ message: "Voice recording isn't supported in this browser", type: "error" });
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    discardRecordingRef.current = false;
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(recordTimerRef.current);
      setRecording(false);
      setRecordSeconds(0);
      if (discardRecordingRef.current || chunks.length === 0) return;
      const type = mimeType.split(";")[0];
      const ext = type === "audio/mp4" ? "m4a" : type.split("/")[1];
      const file = new File(chunks, `voice-message-${Date.now()}.${ext}`, { type });
      setAttachment(file);
      setAttachmentPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  };

  const stopRecording = useCallback((discard = false) => {
    discardRecordingRef.current = discard;
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  // Abandon any in-flight recording on unmount
  useEffect(
    () => () => {
      stopRecording(true);
      clearInterval(recordTimerRef.current);
    },
    [stopRecording]
  );

  // Seed local message list from REST history; keep any live socket
  // messages that arrived while the (re)fetch was in flight
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return history;
      const lastId = history.length ? history[history.length - 1].id : 0;
      const extras = prev.filter((m) => m.id > lastId);
      return [...history, ...extras];
    });
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
    const file = attachment;
    if ((!body && !file) || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage({ projectId, body, file }).unwrap();
      // The socket "chat:message" broadcast (including to the sender) appends it —
      // no manual append here to avoid duplicates.
      if (file) {
        clearAttachment();
        // Chat uploads are registered as project files — refresh the Files tab
        dispatch(fileApiSlice.util.invalidateTags([{ type: "ProjectFile", id: projectId }]));
      }
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
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
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3 text-brand-400">
              <Icon name="message" className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">No messages yet. Say hello to the team!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.flatMap((m, i) => {
              const isOwn = m.user_id === currentUser?.id;
              const canDelete = isOwn || canModerate;
              const day = new Date(m.created_at).toDateString();
              const prev = i > 0 ? messages[i - 1] : null;
              const prevDay = prev ? new Date(prev.created_at).toDateString() : null;
              // Telegram-style grouping: same sender, same day, within 5 minutes
              const groupStart =
                !prev ||
                prev.user_id !== m.user_id ||
                prevDay !== day ||
                new Date(m.created_at) - new Date(prev.created_at) > 5 * 60 * 1000;
              const nodes = [];

              if (day !== prevDay) {
                nodes.push(
                  <motion.div
                    key={`day-${day}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center py-1 mt-3 first:mt-0"
                  >
                    <span className="px-3 py-0.5 rounded-full bg-white/6 text-[11px] font-medium text-slate-400 select-none">
                      {formatChatDate(m.created_at)}
                    </span>
                  </motion.div>
                );
              }

              nodes.push(
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 group ${groupStart ? "mt-3 first:mt-0" : "mt-0.5"} ${isOwn ? "flex-row-reverse justify-end" : ""}`}
                >
                  {groupStart ? (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: m.color || "#6366f1" }}
                    >
                      {m.initials}
                    </div>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}
                  <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
                    {!isOwn && groupStart && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-300">{m.user_name}</span>
                      </div>
                    )}

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
                        <div className={`text-sm break-words px-3 py-1.5 inline-block max-w-xs text-left ${isOwn ? `bg-brand-500/40 text-slate-100 rounded-l-2xl rounded-br-md ${groupStart ? "rounded-tr-2xl" : "rounded-tr-md"}` : `bg-white/6 text-slate-300 rounded-r-2xl rounded-bl-md ${groupStart ? "rounded-tl-2xl" : "rounded-tl-md"}`}`}>
                          {!!m.attachment_id && (
                            <MessageAttachment
                              m={m}
                              onError={() => toast({ message: "Download failed", type: "error" })}
                            />
                          )}
                          {!!m.body && <MarkdownMessage text={m.body} />}
                          <span className={`float-right whitespace-nowrap select-none text-[10px] leading-none ml-2 mt-2 ${isOwn ? "text-slate-300/60" : "text-slate-500"}`}>
                            {!!m.edited && "edited "}
                            {formatTime(m.created_at)}
                          </span>
                        </div>
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
              return nodes;
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Typing indicator */}
      <div className="px-4 h-5 shrink-0">
        <AnimatePresence>
          {typingNames.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-slate-600 italic flex items-center gap-1.5"
            >
              <span className="flex items-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-slate-500 inline-block"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                  />
                ))}
              </span>
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : `${typingNames.slice(0, 2).join(", ")}${typingNames.length > 2 ? " and others" : ""} are typing…`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/6 shrink-0">
        <AnimatePresence>
          {attachment && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-white/6 border border-white/8"
            >
              {attachment.type.startsWith("audio/") ? (
                <>
                  <span className="w-8 h-8 rounded bg-brand-500/15 flex items-center justify-center shrink-0 text-brand-300">
                    <Icon name="mic" className="w-4 h-4" />
                  </span>
                  <audio controls src={attachmentPreview} className="flex-1 min-w-0 h-9" />
                </>
              ) : (
                <>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded bg-white/8 flex items-center justify-center shrink-0 text-slate-400">
                      <Icon name="paperclip" className="w-4 h-4" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-300 truncate">{attachment.name}</p>
                    <p className="text-[10px] text-slate-500">{formatFileSize(attachment.size)}</p>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={clearAttachment}
                title="Remove attachment"
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 transition-all shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={pickAttachment} />
          {recording ? (
            <>
              <div className="mf-input flex-1 text-sm flex items-center gap-2 select-none">
                <motion.span
                  className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-slate-300">
                  Recording… {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => stopRecording(true)}
                title="Cancel recording"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-white/8 transition-all shrink-0"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stopRecording(false)}
                title="Finish recording"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all shrink-0"
              >
                Stop
              </button>
            </>
          ) : (
            <>
              <textarea
                rows={1}
                className="mf-input flex-1 text-sm resize-none max-h-32"
                placeholder="Message the team…"
                value={draft}
                maxLength={4000}
                onChange={(e) => { setDraft(e.target.value); emitTyping(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={startRecording}
                disabled={sending}
                title="Record a voice message"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-300 hover:bg-brand-500/10 border border-white/8 transition-all disabled:opacity-50 shrink-0"
              >
                <Icon name="mic" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                title="Attach a file or image"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-brand-300 hover:bg-brand-500/10 border border-white/8 transition-all disabled:opacity-50 shrink-0"
              >
                <Icon name="paperclip" className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={sending || (!draft.trim() && !attachment)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50 shrink-0"
              >
                {sending ? "…" : "Send"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
