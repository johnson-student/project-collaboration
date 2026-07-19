import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, updateTokens } from "../features/auth/authSlice.js";
import {
  apiBaseUrl,
  getStoredAccessToken,
  setStoredAuthTokens,
  shouldAttemptTokenRefresh,
} from "./authSession.js";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getStoredAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const refreshBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status !== 401) return result;

  const requestUrl = typeof args === "string" ? args : args?.url;
  if (!shouldAttemptTokenRefresh(requestUrl)) return result;

  const refreshResult = await refreshBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
    },
    api,
    extraOptions,
  );
  const accessToken = refreshResult?.data?.data?.accessToken;
  
  if (accessToken) {
    setStoredAuthTokens({ accessToken });
    api.dispatch(updateTokens(refreshResult.data.data));
    result = await rawBaseQuery(args, api, extraOptions);
    return result;
  }

  api.dispatch(logout());
  return result;
};
