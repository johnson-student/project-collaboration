import { cn } from "../../utils/helpers.js";

const inputBase =
  "w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all outline-none border focus:ring-2 ring-offset-0";
const inputStyle =
  "bg-white/5 border-white/10 focus:border-brand-500/50 focus:ring-brand-500/20";

export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-400">{label}</label>
      )}
      <input
        className={cn(inputBase, inputStyle, error && "border-red-500/50 focus:border-red-500/70", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-400">{label}</label>
      )}
      <textarea
        rows={3}
        className={cn(inputBase, inputStyle, "resize-none", error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], className = "", ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-400">{label}</label>
      )}
      <select
        className={cn(inputBase, inputStyle, "cursor-pointer", className)}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
