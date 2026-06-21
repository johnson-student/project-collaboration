export const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const apiRootUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const getStoredAccessToken = () => localStorage.getItem("token");

export const setStoredAuthTokens = ({ accessToken }) => {
  if (accessToken) localStorage.setItem("token", accessToken);
};

export const clearStoredAuth = () => {
  ["token", "refreshToken", "user"].forEach((key) =>
    localStorage.removeItem(key),
  );
};

export const shouldAttemptTokenRefresh = (requestUrl = "") =>
  ![
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/logout",
    "/auth/refresh",
  ].some((path) => requestUrl.includes(path));
