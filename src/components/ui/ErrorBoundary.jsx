import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * GlobalErrorBoundary — catches unhandled render errors across the entire app.
 * Renders a mobile-native themed fallback screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-8 text-center"
        style={{ backgroundColor: "var(--bg-app)", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
        >
          <AlertTriangle className="w-10 h-10" style={{ color: "#ef4444" }} />
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)", maxWidth: 300 }}>
          An unexpected error occurred. Your data is safe — tap below to return to the home screen.
        </p>

        {/* Error detail (dev only) */}
        {import.meta.env.DEV && this.state.error && (
          <pre
            className="text-left text-xs p-3 rounded-xl mb-6 w-full overflow-auto max-h-32"
            style={{ backgroundColor: "var(--bg-subtle)", color: "#ef4444", fontFamily: "monospace", maxWidth: 360 }}
          >
            {this.state.error.message}
          </pre>
        )}

        <button
          onClick={this.handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white"
          style={{ backgroundColor: "var(--accent-primary)", minHeight: 52 }}
          aria-label="Return to home screen"
        >
          <RefreshCw className="w-4 h-4" />
          Return to Home
        </button>
      </div>
    );
  }
}