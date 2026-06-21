import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../../features/auth/authApiSlice";
import { setCredentials } from "../../features/auth/authSlice";
import "./auth.css";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm]   = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [show, setShow]   = useState(false);

  const handle = (e) => { setForm((f)=>({...f,[e.target.name]:e.target.value})); setError(""); };

  const strength = (() => {
    const p = form.password; if (!p) return 0;
    return [p.length>=8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  })();
  const sColor = ["","#ef4444","#f59e0b","#06b6d4","#10b981"][strength];
  const sLabel = ["","Weak","Fair","Good","Strong"][strength];

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 8)       return setError("Password must be at least 8 characters.");
    try {
      const data = await register({ name:form.name, email:form.email, password:form.password }).unwrap();
      dispatch(setCredentials(data));
      navigate("/");
    } catch (err) {
      setError(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb auth-orb-1"/><div className="auth-orb auth-orb-2"/><div className="auth-grid"/></div>
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg2)"/>
              <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white" fillOpacity=".9"/>
              <circle cx="22" cy="16" r="3" fill="white" fillOpacity=".5"/>
              <defs><linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg>
          </div>
          <div><h1 className="auth-app-name">CollabFlow</h1><p className="auth-app-tag">Project management, simplified</p></div>
        </div>
        <div className="auth-header">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Get started for free — no credit card required</p>
        </div>
        {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input name="name" type="text" required className="auth-input" placeholder="Jane Smith" value={form.name} onChange={handle} autoComplete="name"/>
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              <input name="email" type="email" required className="auth-input" placeholder="you@company.com" value={form.email} onChange={handle} autoComplete="email"/>
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input name="password" type={show?"text":"password"} required className="auth-input" placeholder="Min. 8 characters" value={form.password} onChange={handle} autoComplete="new-password"/>
              <button type="button" className="auth-eye-btn" onClick={()=>setShow(s=>!s)} tabIndex={-1}>
                {show?<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                :<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>}
              </button>
            </div>
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1,2,3,4].map(i=><div key={i} className="auth-strength-bar" style={{background:i<=strength?sColor:undefined}}/>)}
                </div>
                <span className="auth-strength-label" style={{color:sColor}}>{sLabel}</span>
              </div>
            )}
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input name="confirm" type={show?"text":"password"} required className="auth-input" placeholder="Repeat password" value={form.confirm} onChange={handle} autoComplete="new-password"/>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading?<span className="auth-btn-loading"><span className="auth-spinner"/>Creating account…</span>:"Create account"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
      </div>
    </div>
  );
}
