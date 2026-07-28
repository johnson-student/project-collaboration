import { useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 009 18z" />
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.167 6.656 3.58 9 3.58z" />
  </svg>
);

// Custom-styled button backed by Google's OAuth2 token-client (not the
// pre-rendered GIS credential button) so we control the exact markup —
// the official button widget renders in a cross-origin iframe and always
// includes a white tile behind the logo per Google's brand guidelines,
// which can't be overridden with CSS.
export default function GoogleButton({ onSuccess, disabled, label = "Sign in with Google" }) {
  const clientRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    let pollId;

    const init = () => {
      if (cancelled || !window.google?.accounts?.oauth2) return;
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid email profile",
        callback: (response) => {
          if (response?.access_token) onSuccessRef.current(response.access_token);
        },
      });
      setReady(true);
    };

    if (window.google?.accounts?.oauth2) init();
    else pollId = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(pollId); init(); }
    }, 100);

    return () => { cancelled = true; clearInterval(pollId); };
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <button
      type="button"
      className="google-btn"
      disabled={disabled || !ready}
      onClick={() => clientRef.current?.requestAccessToken()}
    >
      <GoogleLogo />
      <span>{label}</span>
    </button>
  );
}
