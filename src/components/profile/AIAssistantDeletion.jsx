import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AIAssistantDeletion({ user, isOpen, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteConversations, setDeleteConversations] = useState(true);

  const handleDeleteAIAssistant = async () => {
    if (confirmText !== 'DELETE MY DATA') return;

    try {
      setIsDeleting(true);

      // Delete all conversation records for this user
      if (deleteConversations) {
        const conversations = await base44.entities.AgentConversation?.filter?.({ user_email: user?.email }) || [];
        for (const conv of conversations) {
          await base44.entities.AgentConversation?.delete?.(conv.id);
        }

        // Delete related messages
        const messages = await base44.entities.AgentMessage?.filter?.({ user_email: user?.email }) || [];
        for (const msg of messages) {
          await base44.entities.AgentMessage?.delete?.(msg.id);
        }
      }

      // Log deletion for audit trail
      console.log(`AI Assistant data deleted for user: ${user?.email}`);

      setIsDeleted(true);
      setTimeout(() => {
        onClose();
        setIsDeleted(false);
        setConfirmText('');
      }, 2000);
    } catch (error) {
      console.error('Failed to delete AI assistant data:', error);
      alert('Failed to delete data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)', color: '#E53E3E' }}>
            <AlertTriangle className="w-5 h-5" /> Delete AI Assistant Data
          </DialogTitle>
        </DialogHeader>

        {isDeleted ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-12 h-12" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-center text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              AI Assistant data deleted successfully
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #E53E3E' }}>
              <p className="text-sm" style={{ color: '#991B1B' }}>
                This will permanently delete all AI assistant conversations, chat history, and associated data. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConversations}
                  onChange={(e) => setDeleteConversations(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Also delete all conversation messages and chat history
                </span>
              </label>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-hint)' }}>
                Type <strong>DELETE MY DATA</strong> to confirm:
              </p>
              <input
                type="text"
                placeholder="DELETE MY DATA"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: confirmText === 'DELETE MY DATA' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <Button
              onClick={handleDeleteAIAssistant}
              disabled={confirmText !== 'DELETE MY DATA' || isDeleting}
              className="w-full rounded-xl text-white"
              style={{
                backgroundColor: isDeleting ? 'var(--text-hint)' : '#E53E3E',
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete All AI Data
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}