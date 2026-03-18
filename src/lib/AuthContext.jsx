import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzQ0NDQsImV4cCI6MjA1MDExMDQ0NH0.M8qyqYoVwgZxnr-rWdZdSgTRj88SX8uKQf1NuM0eC7U";

// Returns the full profile row, false if deleted, null if network error
async function fetchSupabaseProfile(email) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,full_name,avatar_url,email`,
      {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return false; // explicitly deleted
    console.log(`[auth] Supabase profile fetched for ${email}:`, rows[0]);
    return rows[0]; // { id, full_name, avatar_url, email }
  } catch (e) {
    console.warn('[auth] Supabase profile fetch network error:', e.message);
    return null;
  }
}

// Backwards-compat alias used by heartbeat
async function checkSupabaseProfile(email) {
  const result = await fetchSupabaseProfile(email);
  if (result === false) return false;
  if (result === null) return null;
  return true;
}

// Nuke all persisted local/session cache so stale data never survives a fresh launch
function clearLocalCache() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('[auth] Local cache cleared');
  } catch {}
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const userRef = useRef(null);

  // Keep ref in sync so heartbeat closures always see latest user
  useEffect(() => { userRef.current = user; }, [user]);

  const forceLogout = useCallback(() => {
    console.warn('[auth] forceLogout called — clearing storage and redirecting');
    // Nuke all local/session storage so no stale cache survives
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    setUser(null);
    userRef.current = null;
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
    setAuthError({ type: 'auth_required', message: 'Authentication required' });
    base44.auth.logout(window.location.href);
  }, []);

  // Heartbeat: check Supabase profile on visibilitychange AND every 30s
  useEffect(() => {
    const runCheck = async () => {
      const currentUser = userRef.current;
      if (!currentUser?.email) return;
      const exists = await checkSupabaseProfile(currentUser.email);
      // Only force logout if explicitly deleted (false), NOT on network errors (null)
      if (exists === false) {
        console.warn(`[auth-heartbeat] ${currentUser.email} not in Supabase — forcing logout`);
        forceLogout();
      }
    };

    // Only check on visibility change (tab becomes active), not on a timer
    // This prevents aggressive logouts when users leave the app idle
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // Only run if tab has been hidden for more than 30 minutes
        const lastHidden = parseInt(sessionStorage.getItem('_tab_hidden_at') || '0');
        if (Date.now() - lastHidden > 30 * 60 * 1000) {
          runCheck();
        }
      } else {
        sessionStorage.setItem('_tab_hidden_at', String(Date.now()));
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    // Check every 60 minutes instead of 30 seconds
    const interval = setInterval(runCheck, 60 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [forceLogout]);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          setAuthError({
            type: reason,
            message: reason === 'auth_required' ? 'Authentication required'
              : reason === 'user_not_registered' ? 'User not registered for this app'
              : appError.message
          });
        } else {
          setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      // Do NOT clear cache on every auth check — this causes stale-data logouts
      // clearLocalCache() removed to prevent session instability

      // Verify the Base44 token is still valid
      let currentUser;
      try {
        currentUser = await base44.auth.me();
      } catch (tokenErr) {
        console.warn('[auth] Token validation failed — forcing logout:', tokenErr.message);
        forceLogout();
        return;
      }

      // Force-fetch the real profile from Supabase so we always show the correct name/avatar,
      // not a stale placeholder. If the row is missing, the account was deleted — kick them out.
      const supabaseProfile = await fetchSupabaseProfile(currentUser.email);
      if (supabaseProfile === false) {
        console.warn(`[auth] BLOCKED LOGIN: ${currentUser.email} deleted from Supabase profiles`);
        forceLogout();
        return;
      }
      if (supabaseProfile === null) {
        console.warn('[auth] Supabase unreachable during login — allowing, using Base44 profile data');
      }

      // Merge Supabase profile data so the app always shows the real name/avatar
      const mergedUser = {
        ...currentUser,
        full_name: supabaseProfile?.full_name || currentUser.full_name,
        avatar_url: supabaseProfile?.avatar_url || currentUser.avatar_url,
      };

      setUser(mergedUser);
      userRef.current = mergedUser;
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    userRef.current = null;
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      forceLogout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};