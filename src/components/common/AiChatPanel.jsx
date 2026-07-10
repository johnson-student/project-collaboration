import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "./Toast.jsx";
import { Icon } from "./icons.jsx";
import { PriorityBadge } from "../ui/index.jsx";
import { formatTime } from "../../utils/helpers.js";
import {
  useGetAiMessagesQuery,
  useSendAiMessageMutation,
  useClearAiChatMutation,
} from "../../features/ai/aiChatApiSlice.js";
import { useCreateTaskMutation } from "../../features/tasks/taskApiSlice.js";

const GENERATE_COMMAND = "/generate-task";

// Structured assistant messages (tasks / clarification) store JSON in content
const parsePayload = (m) => {
  if (m.message_type === "text") return null;
  try { return JSON.parse(m.content); } catch { return null; }
};

// ── Draft task list (from /generate-task) ─────────────────────────────────
function TaskDraftList({ payload, projectId }) {
  const toast = useToast();
  const [createTask] = useCreateTaskMutation();
  const [checked, setChecked] = useState(() => payload.tasks.map(() => true));
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const selectedCount = checked.filter(Boolean).length;

  const handleAdd = async () => {
    setAdding(true);
    let okCount = 0;
    const failedTitles = [];
    for (let i = 0; i < payload.tasks.length; i++) {
      if (!checked[i]) continue;
      const t = payload.tasks[i];
      try {
        await createTask({
          title: t.title,
          description: t.description || undefined,
          priority: t.priority,
          status: "Todo",
          projectId: Number(projectId),
          estimatedHours: t.estimatedHours || undefined,
        }).unwrap();
        okCount++;
      } catch {
        failedTitles.push(t.title);
      }
    }
    setAdding(false);
    if (okCount > 0) {
      setAdded(true);
      toast({ message: `${okCount} task${okCount !== 1 ? "s" : ""} added to the project`, type: "success" });
    }
    if (failedTitles.length > 0) {
      toast({ message: `Couldn't add: ${failedTitles.join(", ")}`, type: "error" });
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      {payload.tasks.map((t, i) => (
        <label
          key={i}
          className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border transition-all cursor-pointer ${
            checked[i] ? "bg-white/4 border-white/10" : "bg-transparent border-white/5 opacity-50"
          } ${added ? "pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={checked[i]}
            disabled={added}
            onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
            className="mt-1 accent-indigo-500 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-200 leading-snug">{t.title}</span>
            {t.description && <span className="block text-xs text-slate-500 mt-0.5">{t.description}</span>}
            <span className="flex items-center gap-2 mt-1.5">
              <PriorityBadge priority={t.priority} />
              {t.estimatedHours && <span className="text-[10px] text-slate-500">~{t.estimatedHours}h</span>}
            </span>
          </span>
        </label>
      ))}
      <div className="pt-1">
        {added ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Icon name="check-circle" className="w-3.5 h-3.5" /> Added to the board
          </span>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || selectedCount === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50"
          >
            {adding ? "Adding…" : `Add ${selectedCount} task${selectedCount !== 1 ? "s" : ""} to board`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── One message bubble ─────────────────────────────────────────────────────
function AiMessage({ m, projectId }) {
  const isUser = m.role === "user";
  const payload = parsePayload(m);

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 bg-brand-500/15 border border-brand-500/25 text-brand-300">
          <Icon name="sparkles" className="w-4 h-4" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 border ${
          isUser
            ? "bg-brand-500/20 border-brand-500/25 rounded-br-md"
            : "bg-white/4 border-white/6 rounded-bl-md"
        }`}
      >
        {payload ? (
          <>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{payload.message}</p>
            {payload.type === "tasks" && <TaskDraftList payload={payload} projectId={projectId} />}
            {payload.type === "clarification" && (
              <ul className="mt-2 space-y-1">
                {payload.questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-brand-400 font-bold shrink-0">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{m.content}</p>
        )}
        <p className={`text-[10px] mt-1.5 ${isUser ? "text-brand-300/50 text-right" : "text-slate-600"}`}>
          {formatTime(m.created_at)}
        </p>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export default function AiChatPanel({ projectId }) {
  const toast = useToast();
  const { data: messages = [], isLoading } = useGetAiMessagesQuery(projectId);
  const [sendAiMessage, { isLoading: sending }] = useSendAiMessageMutation();
  const [clearAiChat] = useClearAiChatMutation();

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(null); // optimistic user bubble while waiting
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    setPending(message);
    try {
      await sendAiMessage({ projectId, message }).unwrap();
    } catch (err) {
      setDraft(message); // let the user retry without retyping
      toast({ message: err?.data?.message || "Failed to send message", type: "error" });
    } finally {
      setPending(null);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear your AI conversation for this project?")) return;
    try {
      await clearAiChat(projectId).unwrap();
    } catch {
      toast({ message: "Failed to clear conversation", type: "error" });
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 flex flex-col" style={{ background: "#111827", height: "calc(100vh - 380px)", minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand-500/15 border border-brand-500/25 text-brand-300">
            <Icon name="sparkles" className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">AI Assistant</p>
            <p className="text-[10px] text-slate-500">Powered by Gemini · knows this project's details and tasks</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-red-400 transition-all"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-slate-600 text-sm py-8">Loading conversation…</p>
        ) : messages.length === 0 && !pending ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-brand-500/10 border border-brand-500/20 text-brand-300">
              <Icon name="sparkles" className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Ask me anything about this project</p>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              I can help you plan, prioritize, and break down work — and I can update the
              project's name, description, or deadline and add subtasks to tasks if you ask. Type{" "}
              <code className="text-brand-300 bg-brand-500/10 px-1 py-0.5 rounded">{GENERATE_COMMAND}</code>{" "}
              and I'll suggest tasks for this project — or ask you for more detail if I need it.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <AiMessage key={m.id} m={m} projectId={projectId} />
            ))}
            {pending && (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 border bg-brand-500/20 border-brand-500/25">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{pending}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-brand-500/15 border border-brand-500/25 text-brand-300">
                    <Icon name="sparkles" className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white/4 border border-white/6">
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-500"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 py-3 border-t border-white/6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => send(GENERATE_COMMAND)}
            disabled={sending}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/4 text-slate-400 border border-white/8 hover:text-brand-300 hover:border-brand-500/30 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            ⚡ Generate tasks
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(draft); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
            placeholder={`Message the AI, or type ${GENERATE_COMMAND}…`}
            className="flex-1 rounded-xl bg-white/4 border border-white/8 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40 transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
