import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RichTextComposerModal from "@/components/community/RichTextComposerModal";

export default function CreatePost() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
          className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          Log in to create a post
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RichTextComposerModal
        user={user}
        onClose={() => navigate(-1)}
        onCreated={() => navigate('/Home')}
      />
    </div>
  );
}