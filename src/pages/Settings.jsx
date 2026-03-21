import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Bell, Settings2, Moon, Languages,
  Users, HelpCircle, FileText, Shield, LogOut, Trash2, AlertTriangle, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import BottomSheet from "@/components/ui/BottomSheet";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifPaused, setNotifPaused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteStep, setDeleteStep] = useState(1); // 1 = warning, 2 = confirm
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSignOut = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE" || deleting) return;
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteUserAccount', {});
    } catch (err) {
      console.error("Delete account error:", err);
    } finally {
      base44.auth.logout();
    }
  };

  const openDeleteSheet = () => {
    setDeleteStep(1);
    setDeleteInput("");
    setShowDeleteSheet(true);
  };

  const SettingRow = ({ icon: Icon, label, onClick, rightEl, danger }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-full flex items-center justify-between px-4 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" style={{ color: danger ? "#ef4444" : "var(--text-secondary)" }} />
        <span className="text-sm font-medium" style={{ color: danger ? "#ef4444" : "var(--text-primary)" }}>{label}</span>
      </div>
      {rightEl ?? <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
    </button>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className="relative w-12 h-6 rounded-full transition-colors"
      style={{ backgroundColor: value ? "#22c55e" : "var(--border-medium)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );

  const SectionCard = ({ children }) => (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4" style={{ paddingTop: "max(env(safe-area-inset-top,0px), 16px)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-full flex items-center justify-center" style={{ minWidth: 44, minHeight: 44, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Settings</h1>
      </div>

      <div className="flex-1 pb-10">
        {/* Profile card */}
        <SectionCard>
          <button
            onClick={() => navigate("/EditProfile")}
            className="w-full flex items-center justify-between px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-primary), #818cf8)", fontSize: 18 }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (user?.full_name || user?.email || "U")[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{user?.display_name || user?.full_name || "Your Name"}</p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>{user?.username || user?.email || ""}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </SectionCard>

        {/* Notifications & General */}
        <SectionCard>
          <SettingRow
            icon={Bell}
            label="Pause notifications"
            rightEl={<Toggle value={notifPaused} onChange={setNotifPaused} />}
          />
          <SettingRow icon={Settings2} label="General settings" onClick={() => {}} />
        </SectionCard>

        {/* Appearance */}
        <SectionCard>
          <SettingRow
            icon={Moon}
            label="Dark mode"
            rightEl={<Toggle value={darkMode} onChange={setDarkMode} />}
          />
          <SettingRow icon={Languages} label="Language" onClick={() => {}} />
          <SettingRow icon={Users} label="My Contacts" onClick={() => {}} />
        </SectionCard>

        {/* Support & Legal */}
        <SectionCard>
          <SettingRow icon={HelpCircle} label="FAQ" onClick={() => navigate("/HelpCenter")} />
          <SettingRow icon={FileText} label="Terms of service" onClick={() => {}} />
          <SettingRow icon={Shield} label="User policy" onClick={() => {}} />
        </SectionCard>

        {/* Export Data */}
        <SectionCard>
          <SettingRow icon={FileText} label="Export Data" onClick={() => {}} />
        </SectionCard>

        {/* Sign Out */}
        <div className="mx-4 mt-2">
          <button
            onClick={handleSignOut}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            style={{ border: "1px solid #ef4444", color: "#ef4444", backgroundColor: "transparent" }}
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* Delete Account — Apple Compliance */}
        <SectionCard>
          <button
            onClick={openDeleteSheet}
            className="w-full flex items-center justify-between px-4 py-4"
            aria-label="Delete account permanently"
            style={{ minHeight: 52 }}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" style={{ color: "#ef4444" }} />
              <span className="text-sm font-medium" style={{ color: "#ef4444" }}>Delete Account</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </SectionCard>
      </div>

      {/* Delete Account Bottom Sheet */}
      <BottomSheet open={showDeleteSheet} onClose={() => setShowDeleteSheet(false)} title="Delete Account">
        {deleteStep === 1 ? (
          <div className="px-5 py-6 space-y-5">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ef44441a" }}>
                <AlertTriangle className="w-8 h-8" style={{ color: "#ef4444" }} />
              </div>
              <h3 className="text-lg font-bold text-center" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Permanently Delete Account?</h3>
              <p className="text-sm text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                This will permanently erase your profile, posts, messages, coins, and all associated data. <strong>This action cannot be undone.</strong>
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
              {["Your profile and posts will be deleted", "Your coin balance will be lost", "Your messages will be removed", "You will be logged out immediately"].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#ef4444" }} />
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteSheet(false)}
                className="flex-1 font-semibold text-sm rounded-2xl"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minHeight: 52 }}>
                Keep Account
              </button>
              <button onClick={() => setDeleteStep(2)}
                className="flex-1 font-bold text-sm rounded-2xl text-white"
                style={{ backgroundColor: "#ef4444", minHeight: 52 }}>
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 space-y-4">
            <p className="text-sm text-center font-semibold" style={{ color: "#ef4444" }}>Final confirmation required</p>
            <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
              Type <strong style={{ color: "var(--text-primary)" }}>DELETE</strong> in the box below to permanently delete your account.
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              autoFocus
              className="w-full px-4 rounded-2xl text-sm text-center outline-none tracking-widest font-bold uppercase"
              style={{
                backgroundColor: "var(--bg-subtle)",
                border: `2px solid ${deleteInput === "DELETE" ? "#ef4444" : "var(--border-light)"}`,
                color: "var(--text-primary)",
                minHeight: 52,
                transition: "border-color 0.2s ease",
              }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteStep(1); setDeleteInput(""); }}
                className="flex-1 font-semibold text-sm rounded-2xl"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minHeight: 52 }}>
                Back
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "DELETE" || deleting}
                aria-label="Permanently delete account"
                className="flex-1 font-bold text-sm rounded-2xl text-white disabled:opacity-35"
                style={{ backgroundColor: "#ef4444", minHeight: 52 }}>
                <span className="flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? "Deleting..." : "Delete Forever"}
                </span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}