import { io } from "socket.io-client";
import { apiRootUrl, getStoredAccessToken } from "./authSession.js";

let socket = null;

/**
 * Returns a shared Socket.IO client instance, creating it on first call.
 * Re-uses the same connection across the whole app (one connection per tab).
 */
export function getSocket() {
  if (socket) return socket;

  socket = io(apiRootUrl, {
    autoConnect: false,
    auth: (cb) => cb({ token: getStoredAccessToken() }),
    transports: ["websocket", "polling"],
  });

  return socket;
}

/** Connect (or reconnect with a fresh token) — call after login. */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect — call on logout. */
export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
