import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple in-memory typing state using a shared event bus
const TYPING_TIMEOUT = 3000;

export function useTypingIndicator(groupId, user) {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!groupId || !user?.email) return;

    const handler = (e) => {
      if (e.detail.groupId !== groupId) return;
      const { email, name, typing } = e.detail;
      if (email === user.email) return;
      setTypingUsers(prev => {
        if (typing) {
          const exists = prev.find(u => u.email === email);
          if (exists) return prev.map(u => u.email === email ? { ...u, ts: Date.now() } : u);
          return [...prev, { email, name, ts: Date.now() }];
        } else {
          return prev.filter(u => u.email !== email);
        }
      });
    };

    window.addEventListener("group_typing", handler);
    return () => window.removeEventListener("group_typing", handler);
  }, [groupId, user?.email]);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => prev.filter(u => Date.now() - u.ts < TYPING_TIMEOUT));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return typingUsers;
}

export function broadcastTyping(groupId, user, isTyping) {
  window.dispatchEvent(new CustomEvent("group_typing", {
    detail: { groupId, email: user.email, name: user.full_name || user.email, typing: isTyping }
  }));
}

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers?.length) return null;

  const names = typingUsers.map(u => u.name.split(" ")[0]);
  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        key="typing"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 py-1.5 flex items-center gap-2"
      >
        <div className="flex gap-0.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--accent-primary)" }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>{label}…</p>
      </motion.div>
    </AnimatePresence>
  );
}