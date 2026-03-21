import React, { Suspense } from 'react';

function PageFallback() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
    </div>
  );
}

/** Wraps a React.lazy component in Suspense. Use as a React component. */
export function LazyPage({ LazyComponent, ...props }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/** HOC: returns a regular React component that renders LazyComponent inside Suspense */
export function withSuspense(LazyComponent) {
  function WrappedPage(props) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }
  WrappedPage.displayName = LazyComponent.displayName || 'LazyPage';
  return WrappedPage;
}