import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const user = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
})();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: user || null,
    token: token || null,
    isAuthenticated: !!token,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.token = payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem("token", payload.accessToken);
      localStorage.setItem("user", JSON.stringify(payload.user));
    },
    logout: (state) => {
      state.user = state.token = null;
      state.isAuthenticated = false;
      ["token", "refreshToken", "user"].forEach((k) =>
        localStorage.removeItem(k),
      );
    },
    updateProfile: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    updateTokens: (state, { payload }) => {
      if (payload?.accessToken) state.token = payload.accessToken;
      if (payload?.accessToken)
        localStorage.setItem("token", payload.accessToken);
    },
  },
});

export const { setCredentials, logout, updateProfile, updateTokens } =
  authSlice.actions;
export const selectCurrentUser = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export default authSlice.reducer;
