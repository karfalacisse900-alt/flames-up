import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Bell, Settings2, Moon, Languages,
  Users, HelpCircle, FileText, Shield, LogOut, Trash2, AlertTriangle
} from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifPaused, setNotifPaused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteStep, setDeleteStep] = useState(1); // 1 = warning, 2 = confirm

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSignOut = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    await base44.auth.updateMe({ account_deleted: true });
    base44.auth.logout();
  };

  const openDeleteSheet = () => {
    setDeleteStep(1);
    setDeleteInput("");
    setShowDeleteSheet(true);
  };

  const SettingRow = ({ icon: Icon, label, onClick, rightEl, danger }) => (
    <button
      onClick={onClick}
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
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
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

        {/* Delete Account */}
        <div className="mx-4 mt-3">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-2xl text-sm font-medium"
              style={{ color: "var(--text-hint)" }}
            >
              Delete Account
            </button>
          ) : (
            <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid #ef444440" }}>
              <p className="text-sm font-semibold text-center" style={{ color: "#ef4444" }}>⚠️ This is permanent</p>
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>Type <strong>DELETE</strong> to confirm deletion of your account and all data.</p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-center outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid #ef444440", color: "var(--text-primary)" }}
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE"}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: "#ef4444" }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}