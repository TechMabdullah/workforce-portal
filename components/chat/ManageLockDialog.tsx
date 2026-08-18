"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/client";
import { hashPasscode } from "@/lib/crypto/passcode";

interface ManageLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  isCurrentlyLocked: boolean;
}

export function ManageLockDialog({ open, onOpenChange, chatId, isCurrentlyLocked }: ManageLockDialogProps) {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSetPasscode() {
    if (passcode.length < 4) {
      toast.error("Passcode must be at least 4 characters");
      return;
    }
    if (passcode !== confirmPasscode) {
      toast.error("Passcodes don't match");
      return;
    }
    setSubmitting(true);
    try {
      const hash = await hashPasscode(passcode, chatId);
      await updateDoc(doc(db, "chats", chatId), { passcodeHash: hash });
      toast.success(isCurrentlyLocked ? "Passcode updated" : "Chat locked");
      setPasscode("");
      setConfirmPasscode("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set passcode");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveLock() {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "chats", chatId), { passcodeHash: null });
      toast.success("Chat unlocked");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove lock");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> {isCurrentlyLocked ? "Manage Chat Lock" : "Lock This Chat"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{isCurrentlyLocked ? "New passcode" : "Passcode"}</Label>
            <Input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="At least 4 characters" />
          </div>
          <div className="space-y-1">
            <Label>Confirm passcode</Label>
            <Input type="password" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isCurrentlyLocked && (
            <Button variant="outline" onClick={handleRemoveLock} disabled={submitting} className="sm:mr-auto">
              Remove Lock
            </Button>
          )}
          <Button onClick={handleSetPasscode} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isCurrentlyLocked ? "Update Passcode" : "Set Passcode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}