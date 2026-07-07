import { useState, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback(({ message, type = "success", duration = 3500, onClick }) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type, onClick }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // Notification ("info") toasts pop at the top right; success/error stay bottom right.
  const topToasts    = toasts.filter((t) => t.type === "info");
  const bottomToasts = toasts.filter((t) => t.type !== "info");

  const renderToast = (toast, fromTop) => (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: fromTop ? -20 : 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: fromTop ? -10 : 10, scale: 0.95 }}
      className={`toast ${toast.type === "error" ? "toast-error" : toast.type === "info" ? "toast-info" : "toast-success"}`}
      onClick={toast.onClick ? () => { toast.onClick(); removeToast(toast.id); } : undefined}
      style={toast.onClick ? { cursor: "pointer" } : undefined}
      role={toast.onClick ? "button" : undefined}
    >
      {toast.type === "success" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5"/>
          <path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : toast.type === "info" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M8 1.5a4 4 0 00-4 4v2.5L2.8 10h10.4L12 8V5.5a4 4 0 00-4-4z" stroke="#818cf8" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M6.8 12.5a1.3 1.3 0 002.4 0" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5"/>
          <path d="M8 5v3.5M8 11h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button type="button" onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, fontSize: "1rem", lineHeight: 1 }}>×</button>
    </motion.div>
  );

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container-top">
        <AnimatePresence>
          {topToasts.map((t) => renderToast(t, true))}
        </AnimatePresence>
      </div>
      <div className="toast-container">
        <AnimatePresence>
          {bottomToasts.map((t) => renderToast(t, false))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
