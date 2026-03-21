import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomSheet from '@/components/ui/BottomSheet';

/**
 * Apple-compliant Delete Account Modal
 * - Two-step confirmation process
 * - Explicit list of data deletion
 * - 44px+ touch targets
 * - Clear, non-manipulative language
 */
export default function DeleteAccountModal({ open, onClose }) {
  const [step, setStep] = useState(1); // 1 = warning, 2 = confirm
  const [input, setInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (input !== 'DELETE' || deleting) return;
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteUserAccount', {});
    } catch (err) {
      console.error('Delete account error:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      base44.auth.logout();
    }
  };

  const handleClose = () => {
    setStep(1);
    setInput('');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Delete Account">
      {step === 1 ? (
        <div className="px-5 py-6 space-y-5">
          {/* Warning icon and heading */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#ef44441a' }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
            </div>
            <h3
              className="text-lg font-bold text-center"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
            >
              Permanently Delete Account?
            </h3>
            <p
              className="text-sm text-center leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              This will permanently erase all associated data. <strong>This action cannot be undone.</strong>
            </p>
          </div>

          {/* Data deletion list */}
          <div className="space-y-2 p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {[
              'Your profile and all posts',
              'Your coin balance',
              'Your messages and conversations',
              'Your account and personal data',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: '#ef4444' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Action buttons — 52px min height */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 font-semibold text-sm rounded-2xl transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                minHeight: 52,
                padding: '12px',
              }}
            >
              Keep Account
            </button>
            <button
              onClick={() => {
                setStep(2);
                setInput('');
              }}
              className="flex-1 font-bold text-sm rounded-2xl text-white transition-all"
              style={{
                backgroundColor: '#ef4444',
                minHeight: 52,
                padding: '12px',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 space-y-4">
          <p
            className="text-sm text-center font-semibold"
            style={{ color: '#ef4444' }}
          >
            Final confirmation required
          </p>
          <p
            className="text-xs text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> in the box below to confirm.
          </p>

          {/* Confirmation input — 52px height */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Type DELETE"
            autoFocus
            className="w-full px-4 rounded-2xl text-sm text-center outline-none tracking-widest font-bold uppercase"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: `2px solid ${input === 'DELETE' ? '#ef4444' : 'var(--border-light)'}`,
              color: 'var(--text-primary)',
              minHeight: 52,
              transition: 'border-color 0.2s ease',
            }}
          />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(1);
                setInput('');
              }}
              className="flex-1 font-semibold text-sm rounded-2xl transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                minHeight: 52,
                padding: '12px',
              }}
            >
              Back
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={input !== 'DELETE' || deleting}
              aria-label="Permanently delete account"
              className="flex-1 font-bold text-sm rounded-2xl text-white transition-all"
              style={{
                backgroundColor: '#ef4444',
                minHeight: 52,
                padding: '12px',
                opacity: input === 'DELETE' && !deleting ? 1 : 0.5,
                cursor: input === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </span>
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}