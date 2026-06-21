import { useState, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback(({ message, type = "success", duration = 3500 }) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
            >
              {toast.type === "success" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 11h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button type="button" onClick={() => removeToast(toast.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, fontSize: "1rem", lineHeight: 1 }}>×</button>
            </motion.div>
          ))}
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
