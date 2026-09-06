'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Easter egg: click "in" then "it" then "in" then "it" (matching the sequence below) in the
// delete-account copy to find a hidden page. Purely order-based, no time expiry — an earlier
// version reset progress after 2s of inactivity, which silently broke a slow/deliberate
// click-through (e.g. pausing between clicks to verify) with zero visible feedback.
const EASTER_EGG_SEQUENCE = ['in', 'it', 'in', 'it'];

export function DataTab() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const eggProgressRef = useRef(0);

  function handleEggWordClick(word: (typeof EASTER_EGG_SEQUENCE)[number]) {
    const expected = EASTER_EGG_SEQUENCE[eggProgressRef.current];
    eggProgressRef.current = word === expected ? eggProgressRef.current + 1 : word === EASTER_EGG_SEQUENCE[0] ? 1 : 0;

    if (eggProgressRef.current >= EASTER_EGG_SEQUENCE.length) {
      eggProgressRef.current = 0;
      router.push('/easter-egg-334354');
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `money-manager-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Your data has been exported.');
    } catch {
      toast.error("Couldn't export your data, try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_email: confirmEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      await signOut();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Export your data</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Download everything — accounts, transactions, investments, assets, goals, budgets, snapshots — as a
          single JSON file. Yours to keep, no strings attached.
        </p>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="size-4" />
          {isExporting ? 'Preparing…' : 'Export all data (JSON)'}
        </Button>
      </div>

      <div className="border-destructive/30 bg-destructive/5 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-destructive text-sm font-semibold">Delete account</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Permanently deletes your account and every record{' '}
          <span onClick={() => handleEggWordClick('in')}>in</span>{' '}
          <span onClick={() => handleEggWordClick('it')}>it</span>. This cannot be undone — export
          your data first if you might want it later.
        </p>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="size-4" />
          Delete my account
        </Button>
      </div>

      {showDeleteDialog && (
        <Dialog open onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your account and all of your financial data. It cannot be undone.
                Type <span className="font-medium">{user?.email}</span> below to confirm.
              </DialogDescription>
            </DialogHeader>

            <Input
              placeholder="Type your email to confirm"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
            />

            {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting || confirmEmail.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()}
              >
                {isDeleting ? 'Deleting…' : 'Permanently delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
