import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmailMutation, useResendVerificationMutation } from "../../features/auth/authApiSlice";
import "./auth.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [status, setStatus] = useState(token ? "verifying" : "invalid"); // verifying | success | error | invalid | resent
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // StrictMode double-mount guard — token is single-use
    verifyEmail(token).unwrap()
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err?.data?.message || "Verification failed. The link may be invalid or expired.");
      });
  }, [token, verifyEmail]);

  const resend = async (e) => {
    e.preventDefault();
    try { await resendVerification(email).unwrap(); setStatus("resent"); }
    catch (err) { setMessage(err?.data?.message || "Could not resend the email. Please try again."); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb auth-orb-1"/><div className="auth-orb auth-orb-2"/><div className="auth-grid"/></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg4)"/>
              <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white" fillOpacity=".9"/>
              <circle cx="22" cy="16" r="3" fill="white" fillOpacity=".5"/>
              <defs><linearGradient id="lg4" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg>
          </div>
          <div><h1 className="auth-app-name">CollabFlow</h1></div>
        </div>

        {status === "verifying" && (
          <div className="auth-success-state">
            <h2 className="auth-title">Verifying your email…</h2>
            <p className="auth-subtitle">Hang tight, this only takes a second.</p>
          </div>
        )}

        {status === "success" && (
          <div className="auth-success-state">
            <div className="auth-success-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l7 7 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <h2 className="auth-title">Email verified!</h2>
            <p className="auth-subtitle">Your email address has been confirmed. You can now sign in to your account.</p>
            <Link to="/login" className="auth-btn" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:"1.5rem"}}>Sign in</Link>
          </div>
        )}

        {status === "resent" && (
          <div className="auth-success-state">
            <div className="auth-success-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l7 7 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">If <strong>{email}</strong> is registered and unverified, we sent a new verification link.</p>
            <Link to="/login" className="auth-btn" style={{display:"block",textAlign:"center",textDecoration:"none",marginTop:"1.5rem"}}>Back to sign in</Link>
          </div>
        )}

        {(status === "error" || status === "invalid") && (
          <>
            <div className="auth-header">
              <h2 className="auth-title">{status === "invalid" ? "Missing verification link" : "Verification failed"}</h2>
              <p className="auth-subtitle">
                {status === "invalid"
                  ? "This page needs a verification link — open the link from the email we sent you."
                  : message}
              </p>
            </div>
            <form onSubmit={resend} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Resend the link to your email</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  <input type="email" required className="auth-input" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email"/>
                </div>
              </div>
              <button type="submit" className="auth-btn" disabled={isResending}>
                {isResending?<span className="auth-btn-loading"><span className="auth-spinner"/>Sending…</span>:"Resend verification email"}
              </button>
            </form>
            <p className="auth-switch"><Link to="/login" className="auth-link">← Back to sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
