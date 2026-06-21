import { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/auth/authApiSlice";
import "./auth.css";

export default function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setError("");
    try { await forgotPassword(email).unwrap(); setSent(true); }
    catch (err) { setError(err?.data?.message || "Something went wrong. Please try again."); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb auth-orb-1"/><div className="auth-orb auth-orb-2"/><div className="auth-grid"/></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg3)"/>
              <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white" fillOpacity=".9"/>
              <circle cx="22" cy="16" r="3" fill="white" fillOpacity=".5"/>
              <defs><linearGradient id="lg3" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg>
          </div>
          <div><h1 className="auth-app-name">CollabFlow</h1></div>
        </div>
        {sent ? (
          <div className="auth-success-state">
            <div className="auth-success-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l7 7 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">We sent a reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.</p>
            <Link to="/login" className="auth-btn" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:"1.5rem"}}>Back to sign in</Link>
          </div>
        ) : (
          <>
            <div className="auth-header"><h2 className="auth-title">Reset password</h2><p className="auth-subtitle">Enter your email and we'll send you a reset link.</p></div>
            {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{error}</div>}
            <form onSubmit={submit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  <input type="email" required className="auth-input" placeholder="you@company.com" value={email} onChange={(e)=>{setEmail(e.target.value);setError("");}} autoComplete="email"/>
                </div>
              </div>
              <button type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading?<span className="auth-btn-loading"><span className="auth-spinner"/>Sending…</span>:"Send reset link"}
              </button>
            </form>
            <p className="auth-switch"><Link to="/login" className="auth-link">← Back to sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
