import { useState, useRef, useEffect } from "react";
import { useSearchUsersQuery } from "../../features/users/userApiSlice";
import { resolveAssetUrl } from "../../utils/helpers.js";
/**
 * Reusable member picker.
 * Props:
 *   projectId  - if set, scopes search to a project
 *   scope      - "all" | "project-members" | "exclude-project-members"
 *   selected   - array of selected user objects  { id, name, initials, color, avatar }
 *   onChange   - called with new array of user objects
 *   single     - if true, only one selection allowed (for assignee)
 *   placeholder
 */
export default function MemberPicker({
  projectId,
  scope,
  currentUserId,
  selected = [],
  onChange,
  single = false,
  placeholder = "Search members…",
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const effectiveScope = scope || (projectId ? "project-members" : "all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const { data: results = [], isFetching } = useSearchUsersQuery(
    {
      q: debouncedQ,
      scope: effectiveScope,
      ...(projectId ? { projectId } : {}),
    },
    {
      skip:
        !open ||
        (effectiveScope === "project-members" && !projectId),
    },
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (user) => {
    if (single) {
      onChange([user]);
      setOpen(false);
      return;
    }
    const already = selected.find((s) => s.id === user.id);
    onChange(
      already ? selected.filter((s) => s.id !== user.id) : [...selected, user],
    );
  };

  const remove = (id) => onChange(selected.filter((s) => s.id !== id));

  return (
    <div className="mpicker" ref={containerRef}>
      {/* CRITICAL: type="button" prevents accidental form submission */}
      <button
        type="button"
        className="mpicker-selected"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length === 0 && (
          <span className="mpicker-placeholder">{placeholder}</span>
        )}
        {selected.map((u) => (
          <span key={u.id} className="mpicker-tag">
            <span
              className="mpicker-tag-av"
              style={{ background: u.color || "#6366f1" }}
            >
              {u.avatar ? (
                <img
                  src={resolveAssetUrl(u.avatar)}
                  alt={u.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                u.initials
              )}
            </span>
            {!single && <span className="mpicker-tag-name">{u.name}</span>}
            {!single && (
              /* CRITICAL: type="button" prevents accidental form submission */
              <button
                type="button"
                className="mpicker-tag-rm"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(u.id);
                }}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ marginLeft: "auto", flexShrink: 0, color: "#6b7280" }}
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="mpicker-dropdown">
          <div className="mpicker-search-wrap">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ color: "#6b7280", flexShrink: 0 }}
            >
              <circle
                cx="6"
                cy="6"
                r="4"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M10 10l2 2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              autoFocus
              className="mpicker-search"
              placeholder="Type to search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mpicker-list">
            {isFetching && <div className="mpicker-loading">Searching…</div>}
            {!isFetching && results.length === 0 && (
              <div className="mpicker-empty">
                {effectiveScope === "project-members" && !projectId
                  ? "Select a project first"
                  : "No users found"}
              </div>
            )}
            {results
              .map((u) => {
                const sel = selected.some((s) => s.id === u.id);
                return (
                  /* CRITICAL: type="button" prevents accidental form submission */
                  <button
                    type="button"
                    key={u.id}
                    className={`mpicker-option${sel ? " mpicker-option-sel" : ""}`}
                    onClick={() => toggle(u)}
                  >
                    <span
                      className="mpicker-av"
                      style={{ background: u.color || "#6366f1" }}
                    >
                      {u.avatar ? (
                        <img
                          src={resolveAssetUrl(u.avatar)}
                          alt={u.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        u.initials
                      )}
                    </span>
                    <div className="mpicker-info">
                      <span className="mpicker-name">{u.name}</span>
                      <span className="mpicker-email">{u.email}</span>
                    </div>
                    {sel && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 7l4 4 6-6"
                          stroke="#6366f1"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
