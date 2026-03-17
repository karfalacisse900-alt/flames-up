import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzQ0NDQsImV4cCI6MjA1MDExMDQ0NH0.M8qyqYoVwgZxnr-rWdZdSgTRj88SX8uKQf1NuM0eC7U";

// Returns true = exists, false = deleted, null = network error (don't block)
async function checkSupabaseProfile(email) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    console.log(`[auth] Supabase profile check for ${email}: found ${rows.length} row(s)`);
    return Array.isArray(rows) && rows.length > 0;
  } catch (e) {
    console.warn('[auth] Supabase profile check network error:', e.message);
    return null;
  }
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
      if (exists === false) {
        console.warn(`[auth-heartbeat] ${currentUser.email} not in Supabase — forcing logout`);
        forceLogout();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') runCheck();
    };

    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(runCheck, 30000); // check every 30s

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

      // Verify the Base44 token is still valid by calling me()
      let currentUser;
      try {
        currentUser = await base44.auth.me();
      } catch (tokenErr) {
        // Token invalid / expired — clear everything
        console.warn('[auth] Token validation failed — forcing logout:', tokenErr.message);
        forceLogout();
        return;
      }

      // HARD CHECK against Supabase — if the profile row was deleted, kick the user out
      // even if their Base44 token is still technically valid
      const exists = await checkSupabaseProfile(currentUser.email);
      if (exists === false) {
        console.warn(`[auth] BLOCKED LOGIN: ${currentUser.email} deleted from Supabase profiles`);
        forceLogout();
        return;
      }
      if (exists === null) {
        console.warn('[auth] Supabase unreachable during login check — allowing (network issue)');
      }

      setUser(currentUser);
      userRef.current = currentUser;
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