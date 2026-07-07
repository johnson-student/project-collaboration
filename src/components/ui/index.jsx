import { motion } from "framer-motion";
import { statusConfig, priorityConfig, cn } from "../../utils/helpers.js";
import { Icon } from "../common/icons.jsx";

// ── Badge ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig["Todo"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority] || priorityConfig["Low"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.color} ${cfg.bg}`}
    >
      {priority}
    </span>
  );
}

export function TagBadge({ tag }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/6 text-slate-400 border border-white/8">
      {tag}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  className = "",
  type = "button",
  loading = false,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 cursor-pointer select-none";

  const variants = {
    primary:
      "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/40 hover:shadow-brand-800/50",
    secondary:
      "bg-white/8 hover:bg-white/12 text-slate-200 border border-white/10 hover:border-white/20",
    ghost: "text-slate-400 hover:text-slate-200 hover:bg-white/8",
    danger: "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20",
    success: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], disabled && "opacity-50 cursor-not-allowed", className)}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}

// ── Avatar ─────────────────────────────────────────────
export function Avatar({ user, size = "md" }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: user?.color || "#6366f1" }}
      title={user?.name}
    >
      {user?.initials}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4, size = "sm" }) {
  const visible = users.slice(0, max);
  const rest = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <div
          key={u.id}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-900 flex-shrink-0`}
          style={{ backgroundColor: u?.color || "#6366f1" }}
          title={u?.name}
        >
          {u?.initials}
        </div>
      ))}
      {rest > 0 && (
        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold ring-2 ring-slate-900">
          +{rest}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────
export function Skeleton({ className = "" }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border border-white/6" style={{ background: "#111827" }}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3.5 w-full mb-1" />
      <Skeleton className="h-3.5 w-2/3 mb-4" />
      <Skeleton className="h-2 w-full rounded-full mb-3" />
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[0,1,2].map(i => <Skeleton key={i} className="w-7 h-7 rounded-lg ring-2 ring-slate-950" />)}
        </div>
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 text-brand-400">
        {typeof icon === "string" ? <Icon name={icon} className="w-7 h-7" /> : icon}
      </div>
      <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </motion.div>
  );
}

// ── ProgressBar ────────────────────────────────────────
export function ProgressBar({ value = 0, color, className = "" }) {
  const barColor = color || (value >= 80 ? "#10b981" : value >= 50 ? "#6366f1" : value >= 25 ? "#f59e0b" : "#ef4444");
  return (
    <div className={cn("h-1.5 rounded-full bg-white/8 overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: barColor }}
      />
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── StatCard ───────────────────────────────────────────
export function StatCard({ label, value, change, icon, color = "#6366f1" }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 border border-white/6 card-shadow card-shadow-hover transition-shadow"
      style={{ background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-red-400 bg-red-400/10"
            }`}
          >
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <p className="font-display font-bold text-white text-3xl mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </motion.div>
  );
}
