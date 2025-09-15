// store/api/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { getCookie, setCookie, deleteCookie } from "../../../utils/cookies";
import { setCredentials, logout, setError } from "./authSlice";
import type { RootState } from "../../store";
import {
  AuthResponse,
  LoginCredentials,
  PasswordChangeData,
  RegisterData,
  ResetPasswordData,
} from "@/store/types";
import { User } from "../feed/types";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include" as const,
  prepareHeaders: (headers, { getState }) => {
    const token = getCookie("accessToken");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});

// Enhanced base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle token refresh on 401
  if (result?.error?.status === 401) {
    const refreshToken = getCookie("refreshToken");

    if (refreshToken) {
      // Attempt to refresh token
      const refreshResult = await baseQuery(
        {
          url: "/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult?.data) {
        const { accessToken, user } = refreshResult.data as AuthResponse;

        // Store new token
        setCookie("accessToken", accessToken, 7);

        // Update Redux state
        api.dispatch(setCredentials({ user, accessToken }));

        // Retry original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout user
        api.dispatch(logout());
        deleteCookie("accessToken");
        deleteCookie("refreshToken");
      }
    } else {
      // No refresh token, logout user
      api.dispatch(logout());
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation<
      { user: User; accessToken: string },
      LoginCredentials
    >({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: { data: AuthResponse }) => {
        // Extract token from response and set in cookie
        const { accessToken, refreshToken, user } = response.data;

        if (accessToken) {
          setCookie("accessToken", accessToken, 7); // 7 days
        }
        if (refreshToken) {
          setCookie("refreshToken", refreshToken, 30); // 30 days
        }

        return { user, accessToken };
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error: any) {
          dispatch(setError(error.error?.data?.message || "Login failed"));
        }
      },
    }),

    // Register mutation
    register: builder.mutation<
      { user: User; accessToken: string },
      RegisterData
    >({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response: AuthResponse) => {
        const { accessToken, refreshToken, user } = response;

        if (accessToken) {
          setCookie("accessToken", accessToken, 7);
        }
        if (refreshToken) {
          setCookie("refreshToken", refreshToken, 30);
        }

        return { user, accessToken };
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error: any) {
          dispatch(
            setError(error.error?.data?.message || "Registration failed")
          );
        }
      },
    }),

    // Logout mutation
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "users/logout",
        method: "POST",
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          // Even if logout fails on server, clear local state
          console.error("Logout error:", error);
        } finally {
          dispatch(logout());
        }
      },
    }),

    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => "users/checkUser",
      providesTags: ["User"],
      transformResponse: (response: { user: User }) => {
        return response.user;
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          const token = getCookie("accessToken");
          dispatch(
            setCredentials({ user: data, accessToken: token || undefined })
          );
        } catch (error: any) {
          // If getting current user fails and we have a token, it might be invalid
          const token = getCookie("accessToken");
          if (token && error.error?.status === 401) {
            dispatch(logout());
            deleteCookie("accessToken");
            deleteCookie("refreshToken");
          }
        }
      },
    }),

    // Refresh token
    refreshToken: builder.mutation<{ user: User; accessToken: string }, void>({
      query: () => ({
        url: "/refresh",
        method: "POST",
        body: { refreshToken: getCookie("refreshToken") },
      }),
      transformResponse: (response: AuthResponse) => {
        const { accessToken, user } = response;

        if (accessToken) {
          setCookie("accessToken", accessToken, 7);
        }

        return { user, accessToken };
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          dispatch(logout());
        }
      },
    }),

    // Change password
    changePassword: builder.mutation<{ message: string }, PasswordChangeData>({
      query: (passwordData) => ({
        url: "/change-password",
        method: "PUT",
        body: passwordData,
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: ({ email }) => ({
        url: "/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<{ message: string }, ResetPasswordData>({
      query: ({ token, newPassword, confirmPassword }) => ({
        url: "/reset-password",
        method: "POST",
        body: { token, newPassword, confirmPassword },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
