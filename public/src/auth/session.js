import {
  CURRENT_USER_STORAGE_KEY,
  DEFAULT_USER_ID,
  SUPABASE_ACCESS_TOKEN_STORAGE_KEY,
  SUPABASE_REFRESH_TOKEN_STORAGE_KEY,
} from "../domain/constants.js";

export function getCurrentUserId() {
  try {
    return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) || DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

export function setCurrentUserId(userId) {
  try {
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  } catch {
    // Optional for MVP fallback auth.
  }
}

export function getAccessToken() {
  try {
    return window.localStorage.getItem(SUPABASE_ACCESS_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function getRefreshToken() {
  try {
    return window.localStorage.getItem(SUPABASE_REFRESH_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function hasSupabaseSession() {
  return Boolean(getAccessToken());
}

export function setSupabaseSession(session) {
  try {
    if (session?.access_token) {
      window.localStorage.setItem(SUPABASE_ACCESS_TOKEN_STORAGE_KEY, session.access_token);
    }
    if (session?.refresh_token) {
      window.localStorage.setItem(SUPABASE_REFRESH_TOKEN_STORAGE_KEY, session.refresh_token);
    }
  } catch {
    // Local storage is optional, but preferred for Supabase auth.
  }
}

export function clearSupabaseSession() {
  try {
    window.localStorage.removeItem(SUPABASE_ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(SUPABASE_REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors in the browser.
  }
}

export function getAuthState() {
  return {
    hasSupabaseSession: hasSupabaseSession(),
    currentUserId: getCurrentUserId(),
  };
}
