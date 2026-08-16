"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase/client";
import { computeSafetyNumber } from "@/lib/crypto/safety-number";
import type { AppUser } from "@/types";

interface SafetyNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myUid: string;
  otherUid: string;
  otherDisplayName: string;
}

interface SafetyState {
  number: string | null;
  error: string | null;
}

export function SafetyNumberDialog({ open, onOpenChange, myUid, otherUid, otherDisplayName }: SafetyNumberDialogProps) {
  const [state, setState] = useState<SafetyState>({ number: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      if (!open) return;
      setState({ number: null, error: null });

      const [meSnap, otherSnap] = await Promise.all([
        getDoc(doc(db, "users", myUid)),
        getDoc(doc(db, "users", otherUid)),
      ]);
      const me = meSnap.data() as AppUser | undefined;
      const other = otherSnap.data() as AppUser | undefined;

      if (!me?.signalIdentityKey || !other?.signalIdentityKey) {
        if (!cancelled) setState({ number: null, error: "Encryption isn't fully set up for one of you yet." });
        return;
      }

      const number = await computeSafetyNumber(myUid, me.signalIdentityKey, otherUid, other.signalIdentityKey);
      if (!cancelled) setState({ number, error: null });
    }

    compute().catch(() => {
      if (!cancelled) setState({ number: null, error: "Couldn't compute the safety number." });
    });

    return () => {
      cancelled = true;
    };
  }, [open, myUid, otherUid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Verify Safety Number
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Compare this number with {otherDisplayName} through a separate channel (in person, or a phone call).
            If it matches on both devices, your conversation is confirmed end-to-end secure with no one in between.
          </p>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {!state.error && !state.number && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {state.number && (
            <div className="font-mono text-sm leading-relaxed tracking-wide bg-muted rounded-md p-4 text-center break-words">
              {state.number}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}