import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

// We'll use a simple "typing" entity stored in GroupMember
// Actually we'll use a lightweight in-memory approach via real-time subscriptions on CommunityPost
// Since we don't have a dedicated typing entity, we'll store typing state on a lightweight poll

// Typing state is stored as a fake ephemeral post with type "discussion" and a special marker
// Instead - we use localStorage + a polling approach with the existing entities

const TYPING_KEY = (groupId) => `typing_${groupId}`;

export function useTypingBroadcast(groupId, userEmail, userName) {
  const typingRef = useRef(false);
  const timerRef = useRef(null);

  const setTyping = (isTyping) => {
    if (isTyping === typingRef.current) return;
    typingRef.current = isTyping;

    // Broadcast via localStorage for same-device, and via a shared key
    const data = JSON.parse(localStorage.getItem(TYPING_KEY(groupId)) || "{}");
    if (isTyping) {
      data[userEmail] = { name: userName, ts: Date.now() };
    } else {
      delete data[userEmail];
    }
    localStorage.setItem(TYPING_KEY(groupId), JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("typing_update", { detail: { groupId } }));
  };

  const onKeyPress = () => {
    setTyping(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTyping(false), 3000);
  };

  useEffect(() => {
    return () => {
      setTyping(false);
      clearTimeout(timerRef.current);
    };
  }, [groupId]);

  return { onKeyPress };
}

export function TypingIndicator({ groupId, currentUserEmail }) {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const update = () => {
      const data = JSON.parse(localStorage.getItem(TYPING_KEY(groupId)) || "{}");
      const now = Date.now();
      // Only show users who typed in the last 4 seconds, exclude current user
      const active = Object.entries(data)
        .filter(([email, info]) => email !== currentUserEmail && now - info.ts < 4000)
        .map(([, info]) => info.name);
      setTypingUsers(active);
    };

    update();
    const interval = setInterval(update, 1000);
    window.addEventListener("typing_update", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("typing_update", update);
    };
  }, [groupId, currentUserEmail]);

  return (
    <AnimatePresence>
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 4, height: 0 }}
          className="px-4 py-1.5 flex items-center gap-2"
        >
          {/* Animated dots */}
          <div className="flex gap-0.5 items-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--accent-primary)" }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : typingUsers.length === 2
              ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
              : "Several people are typing..."}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}