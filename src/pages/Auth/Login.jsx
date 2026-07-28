import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation, useGoogleLoginMutation, useResendVerificationMutation } from "../../features/auth/authApiSlice";
import { setCredentials } from "../../features/auth/authSlice";
import "./auth.css";
import { Icon } from "../../components/common/icons.jsx";
import GoogleButton from "../../components/common/GoogleButton.jsx";

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [show, setShow]   = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const from = location.state?.from?.pathname || "/";

  const handle = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setError(""); setUnverified(false); setResent(false); };

  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const data = await login(form).unwrap();
      dispatch(setCredentials(data));
      navigate(from, { replace: true });
    } catch (err) {
      setUnverified(err?.status === 403);
      setError(err?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const resend = async () => {
    try { await resendVerification(form.email).unwrap(); setResent(true); setError(""); }
    catch { setError("Could not resend the verification email. Please try again."); }
  };

  const handleGoogleSuccess = async (accessToken) => {
    setError("");
    try {
      const data = await googleLogin(accessToken).unwrap();
      dispatch(setCredentials(data));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb auth-orb-1"/><div className="auth-orb auth-orb-2"/><div className="auth-grid"/></div>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg1)"/>
              <path d="M8 10h10a6 6 0 010 12H8V10z" fill="white" fillOpacity=".9"/>
              <circle cx="22" cy="16" r="3" fill="white" fillOpacity=".5"/>
              <defs><linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg>
          </div>
          <div><h1 className="auth-app-name">CollabFlow</h1><p className="auth-app-tag">Project management, simplified</p></div>
        </div>
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>
        {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{error}</div>}
        {unverified && !resent && (
          <button type="button" className="auth-btn" style={{marginBottom:"1rem"}} onClick={resend} disabled={isResending || !form.email}>
            {isResending?<span className="auth-btn-loading"><span className="auth-spinner"/>Sending…</span>:"Resend verification email"}
          </button>
        )}
        {resent && <p className="auth-subtitle" style={{marginBottom:"1rem", display:"flex", alignItems:"center", gap:"0.4rem"}}><Icon name="check-circle" className="w-4 h-4" style={{color:"#10b981", flexShrink:0}} /><span>Verification email sent to <strong>{form.email}</strong> — check your inbox.</span></p>}
        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              <input name="email" type="email" required className="auth-input" placeholder="you@company.com" value={form.email} onChange={handle} autoComplete="email"/>
            </div>
          </div>
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label">Password</label>
              <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
            </div>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input name="password" type={show?"text":"password"} required className="auth-input" placeholder="••••••••" value={form.password} onChange={handle} autoComplete="current-password"/>
              <button type="button" className="auth-eye-btn" onClick={()=>setShow(s=>!s)} tabIndex={-1}>
                {show?<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                :<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading?<span className="auth-btn-loading"><span className="auth-spinner"/>Signing in…</span>:"Sign in"}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <GoogleButton onSuccess={handleGoogleSuccess} disabled={isLoading || isGoogleLoading} />
        <p className="auth-switch">Don't have an account? <Link to="/register" className="auth-link">Create one free</Link></p>
      </div>
    </div>
  );
}
