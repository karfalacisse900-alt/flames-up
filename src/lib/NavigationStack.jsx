/**
 * NavigationStack — imperative push/pop navigation API
 *
 * Wraps React Router to provide a native-app-style navigation stack.
 * Components can use `useNavigationStack()` instead of `useNavigate()`
 * to get push/pop/replace semantics with back-stack awareness.
 *
 * All existing <Link> and useNavigate() usage continues to work unchanged.
 */
import React, { createContext, useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavigationStackContext = createContext(null);

export function NavigationStackProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  /** Push a new screen onto the stack (adds to browser history) */
  const push = useCallback((path, state) => {
    navigate(path, { state });
  }, [navigate]);

  /** Pop back to the previous screen */
  const pop = useCallback((delta = -1) => {
    navigate(delta);
  }, [navigate]);

  /** Replace current screen without adding to history */
  const replace = useCallback((path, state) => {
    navigate(path, { replace: true, state });
  }, [navigate]);

  /** Pop to root (first entry in stack) */
  const popToRoot = useCallback((rootPath = "/") => {
    navigate(rootPath, { replace: true });
  }, [navigate]);

  const value = {
    push,
    pop,
    replace,
    popToRoot,
    currentPath: location.pathname,
    locationState: location.state,
  };

  return (
    <NavigationStackContext.Provider value={value}>
      {children}
    </NavigationStackContext.Provider>
  );
}

/** Hook — use in any component instead of useNavigate() for stack semantics */
export function useNavigationStack() {
  const ctx = useContext(NavigationStackContext);
  if (!ctx) throw new Error("useNavigationStack must be used inside NavigationStackProvider");
  return ctx;
}