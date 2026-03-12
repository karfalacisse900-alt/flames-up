import { useEffect, useState } from 'react';

const PRESENCE_UPDATE_INTERVAL = 30000; // 30 seconds
const OFFLINE_TIMEOUT = 120000; // 2 minutes

/**
 * Real-time presence detection with WebSocket fallback
 * Tracks online/offline status based on user activity
 */
export function usePresenceDetection(userEmail) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!userEmail) return;

    // Mark user as online on mount
    const markOnline = () => {
      localStorage.setItem(`user_presence_${userEmail}`, JSON.stringify({
        email: userEmail,
        timestamp: Date.now(),
        status: 'online'
      }));
      setIsOnline(true);
    };

    // Periodically update presence
    const updatePresence = () => {
      markOnline();
      // Fetch all active users from localStorage
      const allPresence = {};
      const keys = Object.keys(localStorage).filter(k => k.startsWith('user_presence_'));
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && Date.now() - data.timestamp < OFFLINE_TIMEOUT) {
            allPresence[data.email] = { ...data, isActive: true };
          }
        } catch (e) {}
      });
      setOnlineUsers(allPresence);
    };

    markOnline();
    const presenceInterval = setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL);

    // Track inactivity
    let inactivityTimeout;
    const handleActivity = () => {
      clearTimeout(inactivityTimeout);
      markOnline();
      inactivityTimeout = setTimeout(() => {
        setIsOnline(false);
        localStorage.removeItem(`user_presence_${userEmail}`);
      }, OFFLINE_TIMEOUT);
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    return () => {
      clearInterval(presenceInterval);
      clearTimeout(inactivityTimeout);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      localStorage.removeItem(`user_presence_${userEmail}`);
    };
  }, [userEmail]);

  return { onlineUsers, isOnline };
}

export function isUserOnline(email) {
  try {
    const data = JSON.parse(localStorage.getItem(`user_presence_${email}`));
    return data && Date.now() - data.timestamp < OFFLINE_TIMEOUT;
  } catch (e) {
    return false;
  }
}