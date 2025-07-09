import { createAction } from "@reduxjs/toolkit";

export interface ApiCallPayload {
  url: string;
  headers?: Record<string, string>;
  data?: any;
  method?: string;
  onStart?: string;
  onSuccess?: string;
  onError?: string;
}

export const apiCallBegan = createAction<ApiCallPayload>("api/callBegan");
export const apiCallSuccess = createAction<any>("api/callSuccess");
export const apiCallFailed = createAction<any>("api/callFailed");

// Other actions…
export const signInBegan = createAction<any>("nextauth/signInBegan");
export const signInSuccess = createAction<any>("nextauth/signInSuccess");
export const signInFailed = createAction<any>("nextauth/signInFailed");

export const loadUserBegan = createAction<any>("nextauth/loadUserBegan");
export const loadUserSuccess = createAction<any>("nextauth/loadUserSuccess");
export const loadUserFailed = createAction<any>("nextauth/loadUserFailed");

export const signOutUser = createAction<any>("nextauth/signOutUser");
