const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

// Date formatting
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
};

export const getDaysUntilDue = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
};

export const isDueSoon = (dateStr, days = 3) => {
  const diff = getDaysUntilDue(dateStr);
  return diff !== null && diff >= 0 && diff <= days;
};

export const isOverdue = (dateStr) => {
  const diff = getDaysUntilDue(dateStr);
  return diff !== null && diff < 0;
};

// Status helpers
export const statusConfig = {
  Todo: { color: "text-slate-400", bg: "bg-slate-400/10", dot: "bg-slate-400" },
  "In Progress": {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    dot: "bg-blue-400",
  },
  Review: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  Done: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  Planning: {
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    dot: "bg-violet-400",
  },
  Completed: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  "On Hold": {
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    dot: "bg-orange-400",
  },
};

export const priorityConfig = {
  High: { color: "text-red-400", bg: "bg-red-400/10", label: "High" },
  Medium: { color: "text-amber-400", bg: "bg-amber-400/10", label: "Medium" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Low" },
};

// Progress color
export const getProgressColor = (progress) => {
  if (progress >= 80) return "#10b981";
  if (progress >= 50) return "#6366f1";
  if (progress >= 25) return "#f59e0b";
  return "#ef4444";
};

export const resolveAssetUrl = (assetPath) => {
  if (!assetPath) return "";
  if (
    /^(https?:)?\/\//.test(assetPath) ||
    assetPath.startsWith("blob:") ||
    assetPath.startsWith("data:")
  ) {
    return assetPath;
  }

  return `${assetBaseUrl}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`;
};

// cn helper (class name utility)
export const cn = (...classes) => classes.filter(Boolean).join(" ");

// Telegram-style chat timestamps
export const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
};

export const formatChatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  const opts = { month: "long", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString("en-US", opts);
};

// Format date + time
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};
