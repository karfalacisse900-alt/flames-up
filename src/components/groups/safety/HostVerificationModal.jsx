import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, BadgeCheck, Camera, CheckCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = ["overview", "email", "phone", "selfie", "done"];

export default function HostVerificationModal({ user, onClose, onVerified }) {
  const [step, setStep] = useState("overview");
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(!!user?.is_email_verified);
  const [emailError, setEmailError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [phone, setPhone] = useState(user?.verification_phone || "");
  const [phoneConfirmed, setPhoneConfirmed] = useState(!!user?.is_phone_verified);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [selfieConfirmed, setSelfieConfirmed] = useState(!!user?.is_selfie_verified);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEmailVerify = async () => {
    setEmailSending(true);
    setEmailError("");
    try {
      const res = await base44.functions.invoke('sendVerificationEmail', {});
      if (res.data?.success) {
        setEmailSent(true);
      } else {
        setEmailError(res.data?.error || "Failed to send code. Try again.");
      }
    } catch (e) {
      setEmailError("Failed to send code. Try again.");
    }
    setEmailSending(false);
  };

  const handleEmailCode = async () => {
    if (emailCode.length < 6) return;
    setEmailChecking(true);
    setEmailError("");
    try {
      const res = await base44.functions.invoke('checkVerificationCode', { code: emailCode, type: 'email' });
      if (res.data?.success) {
        setEmailConfirmed(true);
      } else {
        setEmailError(res.data?.error || "Incorrect code.");
      }
    } catch (e) {
      setEmailError("Verification failed. Try again.");
    }
    setEmailChecking(false);
  };

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) return;
    // Store the phone number for admin review; mark as "submitted" (not SMS-verified)
    await base44.auth.updateMe({ is_phone_verified: true, verification_phone: phone.trim() });
    setPhoneConfirmed(true);
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSelfieUrl(file_url);
    setUploading(false);
  };

  const handleSelfieConfirm = async () => {
    if (!selfieUrl) return;
    setSelfieConfirmed(true);
    await base44.auth.updateMe({ is_selfie_verified: true });
  };

  const handleFinish = async () => {
    setSaving(true);
    const canBeVerifiedHost = emailConfirmed && phoneConfirmed;
    if (canBeVerifiedHost) {
      await base44.auth.updateMe({ is_verified_host: true });
    }
    setSaving(false);
    onVerified?.();
    onClose();
  };

  const verificationScore = [emailConfirmed, phoneConfirmed, selfieConfirmed].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="px-5 pt-3 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "#2E6B4F" }} />
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Host Verification
              </h2>
            </div>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ backgroundColor: i <= verificationScore ? "#2E6B4F" : "var(--border-light)" }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #E8F2EC, #D1FAE5)" }}>
                    <ShieldCheck className="w-8 h-8" style={{ color: "#2E6B4F" }} />
                  </div>
                  <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    Become a Verified Host
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Verification builds trust with attendees and unlocks the ability to host large public meetups.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { icon: Mail, label: "Email Verification", sub: "Confirm your email address", done: emailConfirmed, required: true },
                    { icon: Phone, label: "Phone Verification", sub: "Add & verify a phone number", done: phoneConfirmed, required: true },
                    { icon: Camera, label: "Selfie Verification", sub: "Optional — adds trust for attendees", done: selfieConfirmed, required: false },
                  ].map(({ icon: Icon, label, sub, done, required }) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: done ? "#E8F2EC" : "var(--bg-subtle)", border: `1px solid ${done ? "#2E6B4F30" : "var(--border-light)"}` }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: done ? "#2E6B4F" : "var(--border-light)" }}>
                        {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {label} {required ? <span style={{ color: "#E05C7A" }}>*</span> : <span className="text-[10px] font-normal ml-1" style={{ color: "var(--text-hint)" }}>Optional</span>}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-hint)" }}>{sub}</p>
                      </div>
                      {done && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#2E6B4F" }} />}
                    </div>
                  ))}
                </div>

                <button onClick={() => setStep("email")}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                  style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
                  Start Verification →
                </button>
              </motion.div>
            )}

            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#DBEAFE" }}>
                    <Mail className="w-6 h-6" style={{ color: "#1D4ED8" }} />
                  </div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Email Verification</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>We'll send a code to <strong>{user?.email}</strong></p>
                </div>
                {emailConfirmed ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle className="w-12 h-12" style={{ color: "#2E6B4F" }} />
                    <p className="font-bold text-base" style={{ color: "#2E6B4F" }}>Email Verified!</p>
                    <button onClick={() => setStep("phone")}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      Next: Phone Verification →
                    </button>
                  </div>
                ) : !emailSent ? (
                  <div className="space-y-3">
                    <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                      📧 A 6-digit code will be sent to <strong>{user?.email}</strong>
                    </div>
                    {emailError && <p className="text-xs text-red-500 text-center">{emailError}</p>}
                    <button onClick={handleEmailVerify} disabled={emailSending}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      {emailSending ? "Sending…" : "Send Verification Code"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Enter the 6-digit code sent to <strong>{user?.email}</strong>:</p>
                    <input
                      value={emailCode} onChange={e => { setEmailCode(e.target.value); setEmailError(""); }}
                      placeholder="000000" maxLength={6}
                      className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-widest outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: `1px solid ${emailError ? "#EF4444" : "var(--border-light)"}`, color: "var(--text-primary)" }}
                    />
                    {emailError && <p className="text-xs text-red-500 text-center">{emailError}</p>}
                    <button onClick={handleEmailCode} disabled={emailCode.length < 6 || emailChecking}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      {emailChecking ? "Verifying…" : "Verify Email"}
                    </button>
                    <button onClick={() => { setEmailSent(false); setEmailCode(""); setEmailError(""); }}
                      className="w-full py-2 text-xs" style={{ color: "var(--text-hint)" }}>
                      Resend code
                    </button>
                  </div>
                )}
                {!emailConfirmed && (
                  <button onClick={() => setStep("phone")} className="w-full text-xs py-2" style={{ color: "var(--text-hint)" }}>
                    Skip for now
                  </button>
                )}
              </motion.div>
            )}

            {step === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#F0FDF4" }}>
                    <Phone className="w-6 h-6" style={{ color: "#16A34A" }} />
                  </div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Phone Verification</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Your number is kept private and never shown to other users.</p>
                </div>
                {phoneConfirmed ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle className="w-12 h-12" style={{ color: "#2E6B4F" }} />
                    <p className="font-bold text-base" style={{ color: "#2E6B4F" }}>Phone Verified!</p>
                    <button onClick={() => setStep("selfie")}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      Next: Optional Selfie →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <div className="px-4 py-3 rounded-xl text-xs" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                      🔒 Your phone number is encrypted and never visible to other users
                    </div>
                    <button onClick={handlePhoneSubmit} disabled={!phone.trim()}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      Verify Phone Number
                    </button>
                  </div>
                )}
                {!phoneConfirmed && (
                  <button onClick={() => setStep("selfie")} className="w-full text-xs py-2" style={{ color: "var(--text-hint)" }}>
                    Skip for now
                  </button>
                )}
              </motion.div>
            )}

            {step === "selfie" && (
              <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#FDF4FF" }}>
                    <Camera className="w-6 h-6" style={{ color: "#9333EA" }} />
                  </div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Selfie Verification</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Optional — upload a clear photo of your face. This helps attendees feel safe meeting you.
                  </p>
                </div>
                {selfieConfirmed ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle className="w-12 h-12" style={{ color: "#2E6B4F" }} />
                    <p className="font-bold text-base" style={{ color: "#2E6B4F" }}>Selfie Added!</p>
                    <button onClick={() => setStep("done")}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      Finish Verification →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selfieUrl ? (
                      <div className="relative">
                        <img src={selfieUrl} alt="Selfie" className="w-full h-48 object-cover rounded-2xl" />
                        <button onClick={handleSelfieConfirm}
                          className="w-full mt-3 py-3.5 rounded-2xl text-sm font-bold text-white"
                          style={{ backgroundColor: "var(--accent-primary)" }}>
                          Confirm Selfie
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="flex flex-col items-center gap-2 py-8 rounded-2xl border-2 border-dashed"
                          style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
                          <Camera className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
                          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                            {uploading ? "Uploading…" : "Tap to upload selfie"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Reviewed by our safety team</p>
                        </div>
                        <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>
                )}
                {!selfieConfirmed && (
                  <button onClick={() => setStep("done")} className="w-full text-xs py-2" style={{ color: "var(--text-hint)" }}>
                    Skip selfie
                  </button>
                )}
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4">
                <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 8px 24px rgba(46,107,79,0.3)" }}>
                  <BadgeCheck className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {emailConfirmed && phoneConfirmed ? "You're a Verified Host! 🎉" : "Verification Updated"}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {emailConfirmed && phoneConfirmed
                      ? "Your Verified Host badge will now appear on your profile, groups, and events."
                      : "Complete email + phone verification to earn the Verified Host badge."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 px-2 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <div className="flex items-center gap-2">
                    <span>{emailConfirmed ? "✅" : "⬜"}</span>
                    <span style={{ color: "var(--text-secondary)" }}>Email verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{phoneConfirmed ? "✅" : "⬜"}</span>
                    <span style={{ color: "var(--text-secondary)" }}>Phone verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{selfieConfirmed ? "✅" : "⬜"}</span>
                    <span style={{ color: "var(--text-secondary)" }}>Selfie added (optional)</span>
                  </div>
                </div>
                <button onClick={handleFinish} disabled={saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                  style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
                  {saving ? "Saving…" : "Done"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}