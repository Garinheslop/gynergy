import { createAction } from "@reduxjs/toolkit";

export interface ApiCallPayload {
  url: string;
  headers?: Record<string, string>;
  data?: Record<string, unknown>;
  method?: string;
  onStart?: string;
  onSuccess?: string;
  onError?: string;
}

export interface ApiSuccessPayload {
  data: Record<string, unknown>;
  onSuccess?: string;
}

export interface ApiErrorPayload {
  error: string;
  message?: string;
  onError?: string;
}

export interface AuthPayload {
  email?: string;
  redirectTo?: string;
}

export interface UserPayload {
  user: Record<string, unknown> | null;
}

export const apiCallBegan = createAction<ApiCallPayload>("api/callBegan");
export const apiCallSuccess = createAction<ApiSuccessPayload>("api/callSuccess");
export const apiCallFailed = createAction<ApiErrorPayload>("api/callFailed");

// Other actions…
export const signInBegan = createAction<AuthPayload>("nextauth/signInBegan");
export const signInSuccess = createAction<UserPayload>("nextauth/signInSuccess");
export const signInFailed = createAction<ApiErrorPayload>("nextauth/signInFailed");

export const loadUserBegan = createAction<void>("nextauth/loadUserBegan");
export const loadUserSuccess = createAction<UserPayload>("nextauth/loadUserSuccess");
export const loadUserFailed = createAction<ApiErrorPayload>("nextauth/loadUserFailed");

export const signOutUser = createAction<{ onSuccess?: string }>("nextauth/signOutUser");
