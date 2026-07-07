import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseQueryWithReauth.js";

export const authApiSlice = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth"],
  endpoints: (b) => ({
    getMe:           b.query({ query: () => "/auth/me", transformResponse: (r) => r.data, providesTags: ["Auth"] }),
    login:           b.mutation({ query: (body) => ({ url: "/auth/login",           method: "POST", body }), transformResponse: (r) => r.data }),
    register:        b.mutation({ query: (body) => ({ url: "/auth/register",        method: "POST", body }), transformResponse: (r) => r.data }),
    logout:          b.mutation({ query: ()     => ({ url: "/auth/logout",          method: "POST" }) }),
    forgotPassword:  b.mutation({ query: (email)=> ({ url: "/auth/forgot-password", method: "POST", body: { email } }) }),
    resetPassword:   b.mutation({ query: (body) => ({ url: "/auth/reset-password",  method: "POST", body }) }),
    verifyEmail:         b.mutation({ query: (token) => ({ url: "/auth/verify-email",        method: "POST", body: { token } }) }),
    resendVerification:  b.mutation({ query: (email) => ({ url: "/auth/resend-verification", method: "POST", body: { email } }) }),
  }),
});

export const {
  useGetMeQuery, useLoginMutation, useRegisterMutation,
  useLogoutMutation, useForgotPasswordMutation, useResetPasswordMutation,
  useVerifyEmailMutation, useResendVerificationMutation,
} = authApiSlice;
